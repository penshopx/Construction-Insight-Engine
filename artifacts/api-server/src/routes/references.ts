import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import {
  ArchiveReferenceImportParams,
  ArchiveReferenceImportResponse,
  CreateReferenceImportBody,
  CreateReferenceImportResponse,
  ListReferenceImportsResponse,
  ListReferencesResponse,
  RequestReferenceUploadUrlBody,
  RequestReferenceUploadUrlResponse,
  SearchReferencesQueryParams,
  SearchReferencesResponse,
} from "@workspace/api-zod";
import { db, referenceDocumentsTable, referenceSectionsTable, referenceUploadsTable } from "@workspace/db";
import referenceIndex from "../lib/reference-index.json" with { type: "json" };
import { extractReference, metadataFor } from "../lib/reference-extraction";
import { createReferenceUploadTarget, downloadReferenceObject } from "../lib/reference-storage";
import { provisionWorkspaceForUser, requireWorkspace } from "../lib/workspace";

type IndexedSection = { id: string; sectionNumber: number; heading: string; content: string; topics: string[] };
type IndexedDocument = {
  id: string; title: string; category: string; fileType: string; sourceFilename: string;
  sourceChecksum: string; topics: string[]; sections: IndexedSection[];
};

const builtInDocuments = referenceIndex as IndexedDocument[];
const router: IRouter = Router();
const disclaimer = "Periksa kembali status keberlakuan peraturan, perubahan terbaru, dan kesesuaiannya dengan kontrak Anda sebelum menggunakan kutipan ini.";

function excerptFor(content: string, terms: string[]) {
  const positions = terms.map((term) => content.toLowerCase().indexOf(term)).filter((position) => position >= 0);
  const position = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, position - 180);
  const end = Math.min(content.length, position + 420);
  return `${start > 0 ? "… " : ""}${content.slice(start, end).trim()}${end < content.length ? " …" : ""}`;
}

export async function dynamicDocuments(organizationId?: number): Promise<IndexedDocument[]> {
  if (!organizationId) return [];
  const rows = await db.select().from(referenceDocumentsTable)
    .where(and(
      eq(referenceDocumentsTable.organizationId, organizationId),
      eq(referenceDocumentsTable.processingStatus, "ready"),
      isNull(referenceDocumentsTable.archivedAt),
    )).orderBy(desc(referenceDocumentsTable.createdAt));
  if (!rows.length) return [];
  const sections = await db.select().from(referenceSectionsTable)
    .where(inArray(referenceSectionsTable.documentId, rows.map((row) => row.id)))
    .orderBy(asc(referenceSectionsTable.sectionNumber));
  return rows.map((row) => {
    const documentSections = sections.filter((section) => section.documentId === row.id).map((section) => ({
      id: `db-${section.id}`,
      sectionNumber: section.sectionNumber,
      heading: section.heading || `Bagian ${section.sectionNumber}`,
      content: section.content,
      topics: section.topics,
    }));
    return {
      id: `db-${row.id}`, title: row.title, category: row.category, fileType: row.fileType,
      sourceFilename: row.sourceFilename, sourceChecksum: row.sourceChecksum,
      topics: [...new Set(documentSections.flatMap((section) => section.topics))],
      sections: documentSections,
    };
  });
}

function importPayload(
  row: typeof referenceDocumentsTable.$inferSelect,
  sectionCount?: number,
  replacedByDocumentId?: number | null,
) {
  return {
    id: row.id, title: row.title, category: row.category, fileType: row.fileType,
    sourceFilename: row.sourceFilename, status: row.processingStatus, error: row.processingError,
    sectionCount, createdAt: row.createdAt, processedAt: row.processedAt,
    archivedAt: row.archivedAt, replacesDocumentId: row.replacesDocumentId,
    replacedByDocumentId: replacedByDocumentId ?? null,
  };
}

type ExtractedReference = Awaited<ReturnType<typeof extractReference>>;

export async function finalizeReferenceImport(
  documentId: number,
  organizationId: number,
  extracted: ExtractedReference,
) {
  await db.transaction(async (tx) => {
    const [duplicate] = await tx.select({ id: referenceDocumentsTable.id }).from(referenceDocumentsTable)
      .where(and(
        eq(referenceDocumentsTable.organizationId, organizationId),
        eq(referenceDocumentsTable.sourceChecksum, extracted.checksum),
        eq(referenceDocumentsTable.processingStatus, "ready"),
      ))
      .limit(1);
    if (duplicate && duplicate.id !== documentId) throw new Error("Dokumen dengan isi yang sama sudah ada di katalog");
    await tx.insert(referenceSectionsTable).values(extracted.sections.map((section) => ({ documentId, ...section })));
    await tx.update(referenceDocumentsTable).set({
      sourceChecksum: extracted.checksum, processingStatus: "ready", processingError: null, processedAt: new Date(),
    }).where(and(
      eq(referenceDocumentsTable.id, documentId),
      eq(referenceDocumentsTable.organizationId, organizationId),
    ));
    const [replacement] = await tx.select({ replacesDocumentId: referenceDocumentsTable.replacesDocumentId })
      .from(referenceDocumentsTable).where(and(
        eq(referenceDocumentsTable.id, documentId),
        eq(referenceDocumentsTable.organizationId, organizationId),
      )).limit(1);
    if (replacement?.replacesDocumentId) {
      await tx.update(referenceDocumentsTable).set({ archivedAt: new Date() }).where(and(
        eq(referenceDocumentsTable.id, replacement.replacesDocumentId),
        eq(referenceDocumentsTable.organizationId, organizationId),
        isNull(referenceDocumentsTable.archivedAt),
      ));
    }
  });
}

export async function failReferenceImport(documentId: number, organizationId: number, message: string) {
  await db.update(referenceDocumentsTable).set({
    processingStatus: "failed", processingError: message.slice(0, 500), processedAt: new Date(),
  }).where(and(
    eq(referenceDocumentsTable.id, documentId),
    eq(referenceDocumentsTable.organizationId, organizationId),
  ));
}

async function processImport(
  documentId: number,
  organizationId: number,
  objectPath: string,
  sourceFilename: string,
  expectedSize: number,
) {
  try {
    const buffer = await downloadReferenceObject(objectPath, 20 * 1024 * 1024);
    if (buffer.byteLength !== expectedSize) throw new Error("Ukuran berkas tidak cocok dengan metadata unggahan");
    const extracted = await extractReference(buffer, sourceFilename);
    await finalizeReferenceImport(documentId, organizationId, extracted);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ekstraksi gagal";
    await failReferenceImport(documentId, organizationId, message);
  }
}

router.get("/references", async (req, res): Promise<void> => {
  const clerkUserId = getAuth(req)?.userId;
  const workspace = clerkUserId ? await provisionWorkspaceForUser(clerkUserId) : null;
  const documents = [...await dynamicDocuments(workspace?.organizationId), ...builtInDocuments];
  res.json(ListReferencesResponse.parse(documents.map(({ sections, ...document }) => ({ ...document, sectionCount: sections.length }))));
});

router.get("/references/search", async (req, res): Promise<void> => {
  const query = SearchReferencesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const clerkUserId = getAuth(req)?.userId;
  const workspace = clerkUserId ? await provisionWorkspaceForUser(clerkUserId) : null;
  const documents = [...await dynamicDocuments(workspace?.organizationId), ...builtInDocuments];
  const terms = query.data.q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = documents.filter((document) => !query.data.category || document.category === query.data.category)
    .flatMap((document) => document.sections.filter((section) =>
      terms.every((term) => `${document.title} ${section.heading} ${section.topics.join(" ")} ${section.content}`.toLowerCase().includes(term)),
    ).map((section) => ({
      id: section.id, documentId: document.id, title: document.title, category: document.category,
      fileType: document.fileType, sourceFilename: document.sourceFilename, sourceChecksum: document.sourceChecksum,
      sectionNumber: section.sectionNumber, heading: section.heading, excerpt: excerptFor(section.content, terms), topics: section.topics,
    }))).slice(0, 50);
  res.json(SearchReferencesResponse.parse({ query: query.data.q, total: results.length, results, disclaimer }));
});

router.post("/references/uploads/request-url", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  if (workspace.role !== "manager") {
    res.status(403).json({ error: "Hanya pengelola yang dapat mengunggah referensi" });
    return;
  }
  const body = RequestReferenceUploadUrlBody.safeParse(req.body);
  if (!body.success || !/\.(pdf|doc|docx)$/i.test(body.data.name)) {
    res.status(400).json({ error: "Pilih berkas PDF, DOC, atau DOCX hingga 20 MB" });
    return;
  }
  try {
    const target = await createReferenceUploadTarget(workspace.organizationId);
    await db.insert(referenceUploadsTable).values({
      organizationId: workspace.organizationId,
      uploadedByUserId: workspace.userId,
      objectPath: target.objectPath,
      sourceFilename: body.data.name,
      expectedSize: body.data.size,
    });
    res.json(RequestReferenceUploadUrlResponse.parse(target));
  } catch (error) {
    req.log.error({ err: error }, "Gagal membuat URL unggah referensi");
    res.status(500).json({ error: "Penyimpanan berkas tidak tersedia" });
  }
});

router.get("/references/imports", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  if (workspace.role !== "manager") {
    res.status(403).json({ error: "Hanya pengelola yang dapat melihat status impor" });
    return;
  }
  const rows = await db.select().from(referenceDocumentsTable)
    .where(eq(referenceDocumentsTable.organizationId, workspace.organizationId))
    .orderBy(desc(referenceDocumentsTable.createdAt));
  const counts = rows.length ? await db.select({ documentId: referenceSectionsTable.documentId }).from(referenceSectionsTable)
    .where(inArray(referenceSectionsTable.documentId, rows.map((row) => row.id))) : [];
  const replacedBy = new Map(rows.flatMap((row) =>
    row.replacesDocumentId ? [[row.replacesDocumentId, row.id] as const] : [],
  ));
  res.json(ListReferenceImportsResponse.parse(rows.map((row) =>
    importPayload(row, counts.filter((entry) => entry.documentId === row.id).length, replacedBy.get(row.id)),
  )));
});

router.post("/references/imports", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  if (workspace.role !== "manager") {
    res.status(403).json({ error: "Hanya pengelola yang dapat menambahkan referensi" });
    return;
  }
  const body = CreateReferenceImportBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const metadata = metadataFor(body.data.sourceFilename, body.data.title, body.data.category);
    const { row, upload } = await db.transaction(async (tx) => {
      if (body.data.replacesDocumentId) {
        const [existing] = await tx.select({ id: referenceDocumentsTable.id }).from(referenceDocumentsTable)
          .where(and(
            eq(referenceDocumentsTable.id, body.data.replacesDocumentId),
            eq(referenceDocumentsTable.organizationId, workspace.organizationId),
            eq(referenceDocumentsTable.processingStatus, "ready"),
            isNull(referenceDocumentsTable.archivedAt),
          )).limit(1);
        if (!existing) throw new Error("Referensi yang akan diganti tidak ditemukan atau sudah diarsipkan");
      }
      const [upload] = await tx.update(referenceUploadsTable).set({ consumedAt: new Date() })
        .where(and(
          eq(referenceUploadsTable.organizationId, workspace.organizationId),
          eq(referenceUploadsTable.uploadedByUserId, workspace.userId),
          eq(referenceUploadsTable.objectPath, body.data.objectPath),
          eq(referenceUploadsTable.sourceFilename, body.data.sourceFilename),
          isNull(referenceUploadsTable.consumedAt),
        )).returning();
      if (!upload) throw new Error("Unggahan tidak ditemukan, sudah digunakan, atau bukan milik ruang kerja ini");
      const [row] = await tx.insert(referenceDocumentsTable).values({
        organizationId: workspace.organizationId,
        slug: `upload-${crypto.randomUUID()}`, title: metadata.title, category: metadata.category,
        sourceFilename: body.data.sourceFilename, sourceChecksum: "pending", fileType: metadata.fileType,
        objectPath: body.data.objectPath, processingStatus: "processing",
        replacesDocumentId: body.data.replacesDocumentId,
      }).returning();
      return { row, upload };
    });
    setImmediate(() => void processImport(
      row.id, workspace.organizationId, body.data.objectPath, body.data.sourceFilename, upload.expectedSize,
    ));
    res.status(202).json(CreateReferenceImportResponse.parse(importPayload(row, 0)));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Impor tidak dapat dimulai" });
  }
});

router.post("/references/imports/:id/archive", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  if (workspace.role !== "manager") {
    res.status(403).json({ error: "Hanya pengelola yang dapat mengarsipkan referensi" });
    return;
  }
  const params = ArchiveReferenceImportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.update(referenceDocumentsTable).set({ archivedAt: new Date() }).where(and(
    eq(referenceDocumentsTable.id, params.data.id),
    eq(referenceDocumentsTable.organizationId, workspace.organizationId),
    eq(referenceDocumentsTable.processingStatus, "ready"),
    isNull(referenceDocumentsTable.archivedAt),
  )).returning();
  if (!row) {
    res.status(404).json({ error: "Referensi tidak ditemukan atau sudah diarsipkan" });
    return;
  }
  const sections = await db.select({ id: referenceSectionsTable.id }).from(referenceSectionsTable)
    .where(eq(referenceSectionsTable.documentId, row.id));
  res.json(ArchiveReferenceImportResponse.parse(importPayload(row, sections.length)));
});

export default router;