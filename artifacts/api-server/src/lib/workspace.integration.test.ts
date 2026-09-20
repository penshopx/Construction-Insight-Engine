import { afterEach, describe, expect, it, vi } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import {
  appUsersTable,
  db,
  organizationInvitationsTable,
  organizationMembershipsTable,
  organizationsTable,
  referenceDocumentsTable,
  referenceExtractionJobsTable,
  referenceSectionsTable,
  workItemsTable,
} from "@workspace/db";
import { acceptWorkspaceInvitation, provisionWorkspaceForUser } from "./workspace";
import { dynamicDocuments, failReferenceImport, finalizeReferenceImport } from "../routes/references";
import { downloadReferenceObject } from "./reference-storage";
import { claimReferenceExtractionJob } from "./reference-extraction-worker";

const workItemIds: number[] = [];
const organizationIds: number[] = [];
const userIds: number[] = [];

afterEach(async () => {
  if (workItemIds.length) await db.delete(workItemsTable).where(inArray(workItemsTable.id, workItemIds.splice(0)));
  if (organizationIds.length) await db.delete(organizationsTable).where(inArray(organizationsTable.id, organizationIds.splice(0)));
  if (userIds.length) await db.delete(appUsersTable).where(inArray(appUsersTable.id, userIds.splice(0)));
});

function uniqueId(label: string) {
  return `test_${label}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

describe("organization workspace invariants", () => {
  it("provisions one workspace under concurrent first requests and claims legacy rows", async () => {
    const [legacy] = await db.insert(workItemsTable).values({
      organizationId: 0,
      category: "administration",
      title: uniqueId("legacy"),
      kind: "deadline",
    }).returning();
    workItemIds.push(legacy.id);

    const clerkUserId = uniqueId("concurrent_user");
    const contexts = await Promise.all([
      provisionWorkspaceForUser(clerkUserId),
      provisionWorkspaceForUser(clerkUserId),
      provisionWorkspaceForUser(clerkUserId),
    ]);
    const organizationId = contexts[0].organizationId;
    organizationIds.push(organizationId);
    userIds.push(contexts[0].userId);

    expect(new Set(contexts.map((context) => context.organizationId))).toEqual(new Set([organizationId]));
    const memberships = await db.select().from(organizationMembershipsTable)
      .where(eq(organizationMembershipsTable.userId, contexts[0].userId));
    expect(memberships).toHaveLength(1);
    const [claimed] = await db.select().from(workItemsTable).where(eq(workItemsTable.id, legacy.id));
    expect(claimed.organizationId).toBe(organizationId);
  });

  it("accepts an invitation once and rolls back token consumption on failure", async () => {
    const manager = await provisionWorkspaceForUser(uniqueId("manager"));
    const member = await provisionWorkspaceForUser(uniqueId("member"));
    organizationIds.push(manager.organizationId, member.organizationId);
    userIds.push(manager.userId, member.userId);

    const token = uniqueId("invite_token").padEnd(32, "x");
    const [invitation] = await db.insert(organizationInvitationsTable).values({
      organizationId: manager.organizationId,
      invitedByUserId: manager.userId,
      token,
      role: "member",
      expiresAt: new Date(Date.now() + 60_000),
    }).returning();

    await expect(acceptWorkspaceInvitation(2_000_000_000, token)).rejects.toThrow();
    const [afterRollback] = await db.select().from(organizationInvitationsTable)
      .where(eq(organizationInvitationsTable.id, invitation.id));
    expect(afterRollback.acceptedAt).toBeNull();

    const results = await Promise.all([
      acceptWorkspaceInvitation(member.userId, token),
      acceptWorkspaceInvitation(member.userId, token),
    ]);
    expect(results.filter((result) => result && !("alreadyMember" in result))).toHaveLength(1);
    expect(results.filter((result) => result === null)).toHaveLength(1);

    const memberships = await db.select().from(organizationMembershipsTable).where(and(
      eq(organizationMembershipsTable.organizationId, manager.organizationId),
      eq(organizationMembershipsTable.userId, member.userId),
    ));
    expect(memberships).toHaveLength(1);
    expect(memberships[0].role).toBe("member");
  });

  it("keeps list and update operations inside the active organization", async () => {
    const first = await provisionWorkspaceForUser(uniqueId("tenant_a"));
    const second = await provisionWorkspaceForUser(uniqueId("tenant_b"));
    organizationIds.push(first.organizationId, second.organizationId);
    userIds.push(first.userId, second.userId);

    const inserted = await db.insert(workItemsTable).values([
      { organizationId: first.organizationId, category: "evidence", title: uniqueId("tenant_a_item"), kind: "evidence" },
      { organizationId: second.organizationId, category: "evidence", title: uniqueId("tenant_b_item"), kind: "evidence" },
    ]).returning();
    workItemIds.push(...inserted.map((item) => item.id));

    const firstTenantItems = await db.select().from(workItemsTable)
      .where(eq(workItemsTable.organizationId, first.organizationId));
    expect(firstTenantItems.map((item) => item.id)).toEqual([inserted[0].id]);

    const crossTenantUpdate = await db.update(workItemsTable).set({ completed: true }).where(and(
      eq(workItemsTable.id, inserted[1].id),
      eq(workItemsTable.organizationId, first.organizationId),
    )).returning();
    expect(crossTenantUpdate).toHaveLength(0);
  });

  it("keeps uploaded references inside the active organization", async () => {
    const first = await provisionWorkspaceForUser(uniqueId("reference_tenant_a"));
    const second = await provisionWorkspaceForUser(uniqueId("reference_tenant_b"));
    organizationIds.push(first.organizationId, second.organizationId);
    userIds.push(first.userId, second.userId);

    const documents = await db.insert(referenceDocumentsTable).values([
      {
        organizationId: first.organizationId,
        slug: uniqueId("reference_a"),
        title: "Dokumen ruang A",
        category: "Dasar & Prinsip",
        sourceFilename: "a.pdf",
        sourceChecksum: uniqueId("checksum_a"),
        fileType: "PDF",
      },
      {
        organizationId: second.organizationId,
        slug: uniqueId("reference_b"),
        title: "Dokumen ruang B",
        category: "Dasar & Prinsip",
        sourceFilename: "b.pdf",
        sourceChecksum: uniqueId("checksum_b"),
        fileType: "PDF",
      },
      {
        organizationId: first.organizationId,
        slug: uniqueId("reference_archived"),
        title: "Dokumen lama ruang A",
        category: "Dasar & Prinsip",
        sourceFilename: "lama.pdf",
        sourceChecksum: uniqueId("checksum_archived"),
        fileType: "PDF",
        archivedAt: new Date(),
      },
    ]).returning();
    await db.insert(referenceSectionsTable).values(documents.map((document) => ({
      documentId: document.id,
      sectionNumber: 1,
      heading: "Bagian 1",
      content: `Isi ${document.title} yang cukup panjang untuk menjadi bagian pengujian pemisahan organisasi.`,
      topics: [],
    })));

    const firstDocuments = await dynamicDocuments(first.organizationId);
    expect(firstDocuments.map((document) => document.title)).toEqual(["Dokumen ruang A"]);
    expect(await dynamicDocuments()).toEqual([]);
  });

  it("archives the old version only after its replacement succeeds", async () => {
    const workspace = await provisionWorkspaceForUser(uniqueId("reference_replacement"));
    organizationIds.push(workspace.organizationId);
    userIds.push(workspace.userId);

    const [original] = await db.insert(referenceDocumentsTable).values({
      organizationId: workspace.organizationId,
      slug: uniqueId("original"),
      title: "Referensi awal",
      category: "Dasar & Prinsip",
      sourceFilename: "awal.pdf",
      sourceChecksum: uniqueId("checksum_original"),
      fileType: "PDF",
    }).returning();
    const [failedReplacement] = await db.insert(referenceDocumentsTable).values({
      organizationId: workspace.organizationId,
      slug: uniqueId("failed_replacement"),
      title: "Referensi pengganti gagal",
      category: "Dasar & Prinsip",
      sourceFilename: "gagal.pdf",
      sourceChecksum: "pending",
      fileType: "PDF",
      processingStatus: "processing",
      replacesDocumentId: original.id,
    }).returning();

    await failReferenceImport(failedReplacement.id, workspace.organizationId, "Ekstraksi gagal");
    let [originalAfterFailure] = await db.select().from(referenceDocumentsTable)
      .where(eq(referenceDocumentsTable.id, original.id));
    expect(originalAfterFailure.archivedAt).toBeNull();

    const [successfulReplacement] = await db.insert(referenceDocumentsTable).values({
      organizationId: workspace.organizationId,
      slug: uniqueId("successful_replacement"),
      title: "Referensi pengganti",
      category: "Dasar & Prinsip",
      sourceFilename: "baru.pdf",
      sourceChecksum: "pending",
      fileType: "PDF",
      processingStatus: "processing",
      replacesDocumentId: original.id,
    }).returning();
    await finalizeReferenceImport(successfulReplacement.id, workspace.organizationId, {
      checksum: uniqueId("checksum_replacement"),
      sections: [{
        sectionNumber: 1,
        heading: "Bagian 1",
        content: "Isi referensi pengganti yang berhasil diproses dan masuk ke katalog.",
        topics: [],
      }],
    });

    [originalAfterFailure] = await db.select().from(referenceDocumentsTable)
      .where(eq(referenceDocumentsTable.id, original.id));
    expect(originalAfterFailure.archivedAt).toBeInstanceOf(Date);
    expect((await dynamicDocuments(workspace.organizationId)).map((document) => document.title))
      .toEqual(["Referensi pengganti"]);
  });

  it("claims extraction jobs once and recovers an expired lease after restart", async () => {
    const workspace = await provisionWorkspaceForUser(uniqueId("reference_job"));
    organizationIds.push(workspace.organizationId);
    userIds.push(workspace.userId);
    const [document] = await db.insert(referenceDocumentsTable).values({
      organizationId: workspace.organizationId,
      slug: uniqueId("queued_reference"),
      title: "Referensi antrean",
      category: "Dasar & Prinsip",
      sourceFilename: "antrean.pdf",
      sourceChecksum: "pending",
      fileType: "PDF",
      processingStatus: "processing",
    }).returning();
    const [job] = await db.insert(referenceExtractionJobsTable).values({
      documentId: document.id,
      organizationId: workspace.organizationId,
      objectPath: `/objects/uploads/org-${workspace.organizationId}-${crypto.randomUUID()}`,
      sourceFilename: "antrean.pdf",
      expectedSize: 123,
    }).returning();

    const firstClaim = await claimReferenceExtractionJob();
    expect(firstClaim?.id).toBe(job.id);
    expect(firstClaim?.attempts).toBe(1);
    expect(await claimReferenceExtractionJob()).toBeNull();

    await db.update(referenceExtractionJobsTable).set({
      lockedAt: new Date(Date.now() - 10 * 60_000),
    }).where(eq(referenceExtractionJobsTable.id, job.id));
    const recoveredClaim = await claimReferenceExtractionJob();
    expect(recoveredClaim?.id).toBe(job.id);
    expect(recoveredClaim?.attempts).toBe(2);
    expect(recoveredClaim?.lockToken).not.toBe(firstClaim?.lockToken);
  });

  it("marks an interrupted final attempt as failed instead of exceeding the retry limit", async () => {
    const workspace = await provisionWorkspaceForUser(uniqueId("reference_exhausted_job"));
    organizationIds.push(workspace.organizationId);
    userIds.push(workspace.userId);
    const [document] = await db.insert(referenceDocumentsTable).values({
      organizationId: workspace.organizationId,
      slug: uniqueId("exhausted_reference"),
      title: "Referensi gagal akhir",
      category: "Dasar & Prinsip",
      sourceFilename: "gagal.pdf",
      sourceChecksum: "pending",
      fileType: "PDF",
      processingStatus: "processing",
    }).returning();
    const [job] = await db.insert(referenceExtractionJobsTable).values({
      documentId: document.id,
      organizationId: workspace.organizationId,
      objectPath: `/objects/uploads/org-${workspace.organizationId}-${crypto.randomUUID()}`,
      sourceFilename: "gagal.pdf",
      expectedSize: 123,
      status: "processing",
      attempts: 3,
      maxAttempts: 3,
      lockedAt: new Date(Date.now() - 10 * 60_000),
      lockToken: crypto.randomUUID(),
    }).returning();

    expect(await claimReferenceExtractionJob()).toBeNull();
    const [failedJob] = await db.select().from(referenceExtractionJobsTable)
      .where(eq(referenceExtractionJobsTable.id, job.id));
    const [failedDocument] = await db.select().from(referenceDocumentsTable)
      .where(eq(referenceDocumentsTable.id, document.id));
    expect(failedJob.status).toBe("failed");
    expect(failedJob.attempts).toBe(3);
    expect(failedDocument.processingStatus).toBe("failed");
    expect(failedDocument.processingError).toContain("Gagal setelah 3 percobaan");
  });

  it("replaces existing sections when finalization is safely retried", async () => {
    const workspace = await provisionWorkspaceForUser(uniqueId("reference_finalize_retry"));
    organizationIds.push(workspace.organizationId);
    userIds.push(workspace.userId);
    const [document] = await db.insert(referenceDocumentsTable).values({
      organizationId: workspace.organizationId,
      slug: uniqueId("retry_reference"),
      title: "Referensi retry",
      category: "Dasar & Prinsip",
      sourceFilename: "retry.pdf",
      sourceChecksum: "pending",
      fileType: "PDF",
      processingStatus: "processing",
    }).returning();
    const extracted = {
      checksum: uniqueId("retry_checksum"),
      sections: [{
        sectionNumber: 1,
        heading: "Bagian retry",
        content: "Isi yang harus tetap tunggal meskipun finalisasi dijalankan kembali.",
        topics: [],
      }],
    };

    await finalizeReferenceImport(document.id, workspace.organizationId, extracted);
    await finalizeReferenceImport(document.id, workspace.organizationId, extracted);
    const sections = await db.select().from(referenceSectionsTable)
      .where(eq(referenceSectionsTable.documentId, document.id));
    expect(sections).toHaveLength(1);
  });

  it("stops downloading when actual object bytes exceed the hard limit", async () => {
    const originalFetch = globalThis.fetch;
    process.env.PRIVATE_OBJECT_DIR = "/test-bucket/private";
    const oversized = new Uint8Array(1025);
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ signed_url: "https://storage.test/object" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }))
      .mockResolvedValueOnce(new Response(new ReadableStream({
        start(controller) {
          controller.enqueue(oversized);
          controller.close();
        },
      }), { status: 200 }));

    await expect(downloadReferenceObject(
      "/objects/uploads/org-1-00000000-0000-0000-0000-000000000000",
      1024,
    )).rejects.toThrow("melebihi");
    globalThis.fetch = originalFetch;
  });
});