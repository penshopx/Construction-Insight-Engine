import { and, eq, ne } from "drizzle-orm";
import {
  db,
  pool,
  referenceDocumentsTable,
  referenceExtractionJobsTable,
  referenceSectionsTable,
} from "@workspace/db";
import { extractReference } from "./reference-extraction";
import { logger } from "./logger";
import { downloadReferenceObject } from "./reference-storage";

const POLL_INTERVAL_MS = 5_000;
const LEASE_TIMEOUT_MS = 5 * 60_000;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

type ExtractedReference = Awaited<ReturnType<typeof extractReference>>;

type ClaimedJob = {
  id: number;
  documentId: number;
  organizationId: number;
  objectPath: string;
  sourceFilename: string;
  expectedSize: number;
  attempts: number;
  maxAttempts: number;
  lockToken: string;
};

export async function finalizeReferenceImport(
  documentId: number,
  organizationId: number,
  extracted: ExtractedReference,
  job?: Pick<ClaimedJob, "id" | "lockToken">,
) {
  await db.transaction(async (tx) => {
    if (job) {
      const [owned] = await tx.select({ id: referenceExtractionJobsTable.id })
        .from(referenceExtractionJobsTable)
        .where(and(
          eq(referenceExtractionJobsTable.id, job.id),
          eq(referenceExtractionJobsTable.lockToken, job.lockToken),
          eq(referenceExtractionJobsTable.status, "processing"),
        )).limit(1);
      if (!owned) throw new Error("Klaim pekerjaan ekstraksi sudah tidak berlaku");
    }

    const [duplicate] = await tx.select({ id: referenceDocumentsTable.id }).from(referenceDocumentsTable)
      .where(and(
        eq(referenceDocumentsTable.organizationId, organizationId),
        eq(referenceDocumentsTable.sourceChecksum, extracted.checksum),
        eq(referenceDocumentsTable.processingStatus, "ready"),
        ne(referenceDocumentsTable.id, documentId),
      ))
      .limit(1);
    if (duplicate) throw new Error("Dokumen dengan isi yang sama sudah ada di katalog");

    await tx.delete(referenceSectionsTable).where(eq(referenceSectionsTable.documentId, documentId));
    await tx.insert(referenceSectionsTable).values(
      extracted.sections.map((section) => ({ documentId, ...section })),
    );
    await tx.update(referenceDocumentsTable).set({
      sourceChecksum: extracted.checksum,
      processingStatus: "ready",
      processingError: null,
      processedAt: new Date(),
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
      ));
    }

    if (job) {
      await tx.update(referenceExtractionJobsTable).set({
        status: "completed",
        completedAt: new Date(),
        lockedAt: null,
        lockToken: null,
        lastError: null,
      }).where(and(
        eq(referenceExtractionJobsTable.id, job.id),
        eq(referenceExtractionJobsTable.lockToken, job.lockToken),
      ));
    }
  });
}

export async function failReferenceImport(documentId: number, organizationId: number, message: string) {
  await db.update(referenceDocumentsTable).set({
    processingStatus: "failed",
    processingError: message.slice(0, 500),
    processedAt: new Date(),
  }).where(and(
    eq(referenceDocumentsTable.id, documentId),
    eq(referenceDocumentsTable.organizationId, organizationId),
  ));
}

export async function claimReferenceExtractionJob(): Promise<ClaimedJob | null> {
  const lockToken = crypto.randomUUID();
  await pool.query(`
    WITH exhausted AS (
      UPDATE reference_extraction_jobs
      SET status = 'failed',
          locked_at = NULL,
          lock_token = NULL,
          completed_at = NOW(),
          last_error = COALESCE(last_error, 'Server berhenti saat percobaan terakhir'),
          updated_at = NOW()
      WHERE status = 'processing'
        AND attempts >= max_attempts
        AND locked_at < NOW() - ($1 * INTERVAL '1 millisecond')
      RETURNING document_id, organization_id, attempts, last_error
    )
    UPDATE reference_documents AS document
    SET processing_status = 'failed',
        processing_error = LEFT(
          'Gagal setelah ' || exhausted.attempts || ' percobaan: ' || exhausted.last_error,
          500
        ),
        processed_at = NOW(),
        updated_at = NOW()
    FROM exhausted
    WHERE document.id = exhausted.document_id
      AND document.organization_id = exhausted.organization_id
  `, [LEASE_TIMEOUT_MS]);
  const result = await pool.query<{
    id: number;
    document_id: number;
    organization_id: number;
    object_path: string;
    source_filename: string;
    expected_size: string;
    attempts: number;
    max_attempts: number;
  }>(`
    WITH candidate AS (
      SELECT id
      FROM reference_extraction_jobs
      WHERE (
        status = 'pending' AND available_at <= NOW() AND attempts < max_attempts
      ) OR (
        status = 'processing'
        AND attempts < max_attempts
        AND locked_at < NOW() - ($1 * INTERVAL '1 millisecond')
      )
      ORDER BY available_at, id
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE reference_extraction_jobs AS job
    SET status = 'processing',
        attempts = job.attempts + 1,
        locked_at = NOW(),
        lock_token = $2,
        updated_at = NOW()
    FROM candidate
    WHERE job.id = candidate.id
    RETURNING job.id, job.document_id, job.organization_id, job.object_path,
              job.source_filename, job.expected_size, job.attempts, job.max_attempts
  `, [LEASE_TIMEOUT_MS, lockToken]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    documentId: row.document_id,
    organizationId: row.organization_id,
    objectPath: row.object_path,
    sourceFilename: row.source_filename,
    expectedSize: Number(row.expected_size),
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    lockToken,
  };
}

async function recordJobFailure(job: ClaimedJob, error: unknown) {
  const message = (error instanceof Error ? error.message : "Ekstraksi gagal").slice(0, 500);
  const terminal = job.attempts >= job.maxAttempts;
  const retryDelaySeconds = Math.min(60, 5 * (2 ** Math.max(0, job.attempts - 1)));
  await db.transaction(async (tx) => {
    const [updated] = await tx.update(referenceExtractionJobsTable).set({
      status: terminal ? "failed" : "pending",
      availableAt: terminal ? new Date() : new Date(Date.now() + retryDelaySeconds * 1000),
      lockedAt: null,
      lockToken: null,
      lastError: message,
      completedAt: terminal ? new Date() : null,
    }).where(and(
      eq(referenceExtractionJobsTable.id, job.id),
      eq(referenceExtractionJobsTable.lockToken, job.lockToken),
      eq(referenceExtractionJobsTable.status, "processing"),
    )).returning({ id: referenceExtractionJobsTable.id });
    if (!updated) return;
    await tx.update(referenceDocumentsTable).set({
      processingStatus: terminal ? "failed" : "processing",
      processingError: terminal
        ? `Gagal setelah ${job.attempts} percobaan: ${message}`
        : `Percobaan ${job.attempts} gagal; akan dicoba lagi: ${message}`,
      processedAt: terminal ? new Date() : null,
    }).where(and(
      eq(referenceDocumentsTable.id, job.documentId),
      eq(referenceDocumentsTable.organizationId, job.organizationId),
    ));
  });
}

export async function processNextReferenceExtractionJob(): Promise<boolean> {
  const job = await claimReferenceExtractionJob();
  if (!job) return false;
  try {
    const buffer = await downloadReferenceObject(job.objectPath, MAX_FILE_SIZE);
    if (buffer.byteLength !== job.expectedSize) {
      throw new Error("Ukuran berkas tidak cocok dengan metadata unggahan");
    }
    const extracted = await extractReference(buffer, job.sourceFilename);
    await finalizeReferenceImport(job.documentId, job.organizationId, extracted, job);
  } catch (error) {
    logger.warn({ err: error, jobId: job.id, attempt: job.attempts }, "Reference extraction attempt failed");
    await recordJobFailure(job, error);
  }
  return true;
}

let workerRunning = false;

export function startReferenceExtractionWorker(): NodeJS.Timeout {
  const run = async () => {
    if (workerRunning) return;
    workerRunning = true;
    try {
      while (await processNextReferenceExtractionJob()) {
        // Drain all currently available jobs before waiting for the next poll.
      }
    } catch (error) {
      logger.error({ err: error }, "Reference extraction worker scan failed");
    } finally {
      workerRunning = false;
    }
  };
  void run();
  const timer = setInterval(() => void run(), POLL_INTERVAL_MS);
  timer.unref();
  return timer;
}