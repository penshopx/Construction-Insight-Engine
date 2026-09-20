import express from "express";
import type { Server } from "node:http";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import {
  contractCaseActivitiesTable,
  contractCasesTable,
  db,
  workItemsTable,
} from "@workspace/db";

const workspaceState = vi.hoisted(() => ({ organizationId: 810_001 }));

vi.mock("../lib/workspace", () => ({
  requireWorkspace: vi.fn(async () => ({
    organizationId: workspaceState.organizationId,
    userId: 1,
    role: "manager",
  })),
}));

import contractCasesRouter from "./contract-cases";

const caseIds: number[] = [];
let server: Server;
let baseUrl: string;

const typeRequirements = {
  VO: { instructionSource: "Instruksi tertulis", valuationMethod: "Harga satuan" },
  EOT: { delayCause: "Akses terlambat", daysRequested: "14" },
  CLAIM: { claimCategory: "Biaya tambahan", amountBasis: "Rekap biaya aktual" },
  NCR: { location: "Lantai 2", severity: "Mayor", correctiveAction: "Perbaikan dan inspeksi ulang" },
} as const;

function caseValues(
  type: keyof typeof typeRequirements,
  organizationId = workspaceState.organizationId,
  overrides: Partial<typeof contractCasesTable.$inferInsert> = {},
) {
  return {
    organizationId,
    reference: `TEST-${type}-${crypto.randomUUID()}`,
    type,
    title: `Kasus ${type}`,
    project: "Proyek pengujian",
    eventDate: "2026-09-20",
    noticeDueDate: "2026-09-27",
    noticeReference: "NOTICE-001",
    clauseBasis: "Klausul 20",
    description: "Peristiwa kontraktual untuk pengujian workflow.",
    impactValue: "Rp100.000.000",
    currentStage: 0,
    status: "Active",
    owner: "Pengelola kontrak",
    typeDetails: typeRequirements[type],
    evidence: [{ name: "bukti.pdf" }],
    reviewNotes: "Review teknis dan kontraktual telah selesai.",
    decisionOutcome: "Disetujui",
    ...overrides,
  };
}

async function insertCase(
  type: keyof typeof typeRequirements,
  organizationId = workspaceState.organizationId,
  overrides: Partial<typeof contractCasesTable.$inferInsert> = {},
) {
  const [item] = await db.insert(contractCasesTable)
    .values(caseValues(type, organizationId, overrides))
    .returning();
  caseIds.push(item.id);
  return item;
}

async function patchCase(id: number, body: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}/api/contract-cases/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: await response.json() as { error?: string; missingItems?: Array<{ key: string }> },
  };
}

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api", contractCasesRouter);
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server failed to bind");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(async () => {
  workspaceState.organizationId = 810_001;
  if (!caseIds.length) return;
  const ids = caseIds.splice(0);
  await db.delete(workItemsTable).where(inArray(workItemsTable.caseId, ids));
  await db.delete(contractCaseActivitiesTable).where(inArray(contractCaseActivitiesTable.caseId, ids));
  await db.delete(contractCasesTable).where(inArray(contractCasesTable.id, ids));
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

describe("contract case workflow guardrails", () => {
  for (const [type, requirements] of Object.entries(typeRequirements)) {
    it(`enforces the minimum ${type} fields before Notice`, async () => {
      const missingKey = Object.keys(requirements)[0];
      const item = await insertCase(type as keyof typeof typeRequirements, workspaceState.organizationId, {
        typeDetails: { ...requirements, [missingKey]: "" },
      });

      const rejected = await patchCase(item.id, { currentStage: 1 });
      expect(rejected.status).toBe(400);
      expect(rejected.body.missingItems).toEqual(
        expect.arrayContaining([expect.objectContaining({ key: `typeDetails.${missingKey}` })]),
      );

      const accepted = await patchCase(item.id, {
        currentStage: 1,
        typeDetails: requirements,
      });
      expect(accepted.status).toBe(200);
    });
  }

  it.each([
    {
      label: "notice",
      stage: 1,
      targetStage: 2,
      overrides: { noticeReference: null },
      missingKey: "noticeReference",
    },
    {
      label: "evidence",
      stage: 2,
      targetStage: 3,
      overrides: { evidence: [] },
      missingKey: "evidence",
    },
    {
      label: "impact",
      stage: 2,
      targetStage: 3,
      overrides: { impactValue: null },
      missingKey: "impactValue",
    },
    {
      label: "review",
      stage: 3,
      targetStage: 4,
      overrides: { reviewNotes: null },
      missingKey: "reviewNotes",
    },
  ])("rejects forward movement when $label is incomplete", async ({ stage, targetStage, overrides, missingKey }) => {
    const item = await insertCase("CLAIM", workspaceState.organizationId, {
      currentStage: stage,
      ...overrides,
    });

    const result = await patchCase(item.id, { currentStage: targetStage });

    expect(result.status).toBe(400);
    expect(result.body.missingItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: missingKey })]),
    );
  });

  it("requires a reason when reopening an earlier stage", async () => {
    const item = await insertCase("VO", workspaceState.organizationId, { currentStage: 3 });

    const rejected = await patchCase(item.id, { currentStage: 2 });
    expect(rejected.status).toBe(400);
    expect(rejected.body.error).toContain("Alasan wajib");

    const accepted = await patchCase(item.id, {
      currentStage: 2,
      changeNote: "Bukti dampak perlu diperbaiki.",
    });
    expect(accepted.status).toBe(200);
  });

  it.each([
    { status: "Under Review", stage: 2, decisionOutcome: "Disetujui" },
    { status: "Decided", stage: 3, decisionOutcome: "Disetujui" },
    { status: "Closed", stage: 3, decisionOutcome: "Disetujui" },
    { status: "Decided", stage: 4, decisionOutcome: null },
    { status: "Closed", stage: 4, decisionOutcome: null },
  ])("prevents $status from bypassing its required stage or decision", async ({ status, stage, decisionOutcome }) => {
    const item = await insertCase("EOT", workspaceState.organizationId, {
      currentStage: stage,
      decisionOutcome,
    });

    const result = await patchCase(item.id, { status });

    expect(result.status).toBe(400);
  });

  it("keeps another organization's cases out of workflow validation and updates", async () => {
    const ownCase = await insertCase("NCR", 810_001, {
      currentStage: 0,
      typeDetails: { ...typeRequirements.NCR, location: "" },
    });
    const otherCase = await insertCase("NCR", 810_002, {
      currentStage: 0,
      typeDetails: typeRequirements.NCR,
    });

    workspaceState.organizationId = 810_001;
    const crossOrganization = await patchCase(otherCase.id, { currentStage: 1 });
    expect(crossOrganization.status).toBe(404);

    const ownValidation = await patchCase(ownCase.id, { currentStage: 1 });
    expect(ownValidation.status).toBe(400);
    expect(ownValidation.body.missingItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "typeDetails.location" })]),
    );

    const [unchangedOtherCase] = await db.select().from(contractCasesTable)
      .where(eq(contractCasesTable.id, otherCase.id));
    expect(unchangedOtherCase.currentStage).toBe(0);
  });
});