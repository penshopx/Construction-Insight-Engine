import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq } from "drizzle-orm";
import {
  contractCaseActivitiesTable,
  contractCasesTable,
  db,
  workItemsTable,
} from "@workspace/db";
import {
  CreateContractCaseBody,
  CreateContractCaseResponse,
  ListContractCaseActivitiesParams,
  ListContractCaseActivitiesResponse,
  ListContractCasesResponse,
  UpdateContractCaseBody,
  UpdateContractCaseParams,
  UpdateContractCaseResponse,
} from "@workspace/api-zod";
import { requireWorkspace } from "../lib/workspace";

const router: IRouter = Router();
const stageNames = ["Kejadian", "Notice", "Bukti & Dampak", "Review", "Keputusan"];
type ContractCase = typeof contractCasesTable.$inferSelect;
type ChecklistItem = { key: string; label: string; target: string; complete: boolean };

const hasText = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const specificRequirements: Record<string, Array<{ key: string; label: string }>> = {
  VO: [
    { key: "instructionSource", label: "Sumber instruksi" },
    { key: "valuationMethod", label: "Metode penilaian" },
  ],
  EOT: [
    { key: "delayCause", label: "Penyebab keterlambatan" },
    { key: "daysRequested", label: "Jumlah hari diajukan" },
  ],
  CLAIM: [
    { key: "claimCategory", label: "Kategori klaim" },
    { key: "amountBasis", label: "Dasar perhitungan nilai" },
  ],
  NCR: [
    { key: "location", label: "Lokasi ketidaksesuaian" },
    { key: "severity", label: "Tingkat keparahan" },
    { key: "correctiveAction", label: "Usulan tindakan perbaikan" },
  ],
};

const getStageChecklist = (item: ContractCase) => {
  const specific = specificRequirements[item.type] ?? [];
  const stages: Array<{ stage: number; title: string; items: ChecklistItem[] }> = [
    {
      stage: 1,
      title: "Siap masuk tahap Notice",
      items: [
        { key: "description", label: "Deskripsi kejadian", target: "case-details", complete: hasText(item.description) },
        { key: "clauseBasis", label: "Klausul referensi", target: "case-details", complete: hasText(item.clauseBasis) },
        ...specific.map(({ key, label }) => ({
          key: `typeDetails.${key}`,
          label,
          target: "type-details",
          complete: hasText(item.typeDetails?.[key]),
        })),
      ],
    },
    {
      stage: 2,
      title: "Siap masuk tahap Bukti & Dampak",
      items: [
        { key: "noticeDueDate", label: "Tenggat notice", target: "case-details", complete: hasText(item.noticeDueDate) },
        { key: "noticeReference", label: "Nomor atau referensi notice terkirim", target: "case-details", complete: hasText(item.noticeReference) },
      ],
    },
    {
      stage: 3,
      title: "Siap masuk tahap Review",
      items: [
        { key: "evidence", label: "Minimal satu bukti pendukung", target: "evidence", complete: item.evidence.length > 0 },
        { key: "impactValue", label: "Nilai atau durasi dampak", target: "case-details", complete: hasText(item.impactValue) },
      ],
    },
    {
      stage: 4,
      title: "Siap masuk tahap Keputusan",
      items: [
        { key: "reviewNotes", label: "Catatan hasil review", target: "review-decision", complete: hasText(item.reviewNotes) },
      ],
    },
  ];
  return stages.map((stage) => ({
    ...stage,
    complete: stage.items.every((entry) => entry.complete),
  }));
};

const withChecklist = (item: ContractCase) => ({ ...item, stageChecklist: getStageChecklist(item) });
const toCalendarDate = (value: Date | string | null | undefined) => {
  if (value == null || typeof value === "string") return value;
  return value.toISOString().slice(0, 10);
};

router.get("/contract-cases", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  const cases = await db.select().from(contractCasesTable)
    .where(eq(contractCasesTable.organizationId, workspace.organizationId))
    .orderBy(desc(contractCasesTable.updatedAt));
  res.json(ListContractCasesResponse.parse(cases.map(withChecklist)));
});

router.post("/contract-cases", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  const body = CreateContractCaseBody.safeParse(req.body);
  if (!body.success) {
    req.log.warn({ errors: body.error.message }, "Invalid contractual case");
    res.status(400).json({ error: body.error.message });
    return;
  }

  const item = await db.transaction(async (tx) => {
    const [{ value: existing }] = await tx.select({ value: count() }).from(contractCasesTable)
      .where(and(
        eq(contractCasesTable.organizationId, workspace.organizationId),
        eq(contractCasesTable.type, body.data.type),
      ));
    const reference = `${body.data.type}-${String(Number(existing) + 1).padStart(3, "0")}`;
    const [created] = await tx.insert(contractCasesTable).values({
      ...body.data,
      eventDate: toCalendarDate(body.data.eventDate)!,
      noticeDueDate: toCalendarDate(body.data.noticeDueDate),
      organizationId: workspace.organizationId,
      reference,
      status: "Active",
    }).returning();
    await tx.insert(contractCaseActivitiesTable).values({
      caseId: created.id,
      organizationId: workspace.organizationId,
      action: "Kasus dibuat",
      detail: `Workflow ${body.data.type} dimulai pada tahap Kejadian.`,
      actor: body.data.owner ?? "Tim proyek",
    });
    if (body.data.noticeDueDate) {
      await tx.insert(workItemsTable).values({
        organizationId: workspace.organizationId,
        category: "administration",
        title: `Kirim notice untuk ${reference}`,
        description: `Dasar klausul: ${body.data.clauseBasis}`,
        project: body.data.project,
        owner: body.data.owner,
        status: "Perlu ditinjau",
        due: toCalendarDate(body.data.noticeDueDate),
        kind: `${body.data.type} Notice`,
        caseId: created.id,
        reminderDays: [14, 7, 3, 1],
      });
    }
    return created;
  });
  res.status(201).json(CreateContractCaseResponse.parse(withChecklist(item)));
});

router.patch("/contract-cases/:id", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  const params = UpdateContractCaseParams.safeParse(req.params);
  const body = UpdateContractCaseBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const { changeNote, ...rawChanges } = body.data;
  const hasNoticeDate = Object.prototype.hasOwnProperty.call(rawChanges, "noticeDueDate");
  const { noticeDueDate, ...otherChanges } = rawChanges;
  const changes: Partial<typeof contractCasesTable.$inferInsert> = {
    ...otherChanges,
    ...(hasNoticeDate
      ? { noticeDueDate: toCalendarDate(noticeDueDate) }
      : {}),
  };
  const updated = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(contractCasesTable).where(and(
      eq(contractCasesTable.id, params.data.id),
      eq(contractCasesTable.organizationId, workspace.organizationId),
    )).limit(1);
    if (!current) return null;
    const nextState = { ...current, ...changes };
    const stageChanged = changes.currentStage != null && changes.currentStage !== current.currentStage;
    if (stageChanged && changes.currentStage! < current.currentStage && !hasText(changeNote)) {
      return { validationError: "Alasan wajib diisi saat tahap dibuka kembali.", missingItems: [] };
    }
    if (stageChanged && changes.currentStage! > current.currentStage) {
      if (changes.currentStage! !== current.currentStage + 1) {
        return { validationError: "Tahap hanya dapat dimajukan satu per satu.", missingItems: [] };
      }
      const checklist = getStageChecklist(nextState);
      const target = checklist.find((entry) => entry.stage === changes.currentStage);
      const missingItems = target?.items.filter((entry) => !entry.complete) ?? [];
      if (missingItems.length > 0) {
        return {
          validationError: `Tahap belum dapat dimajukan. Lengkapi ${missingItems.length} item wajib.`,
          missingItems: missingItems.map(({ key, label, target: fieldTarget }) => ({ key, label, target: fieldTarget })),
        };
      }
    }
    if (changes.status === "Under Review" && nextState.currentStage < 3) {
      return {
        validationError: "Status Under Review hanya dapat dipilih setelah kasus mencapai tahap Review.",
        missingItems: [],
      };
    }
    if ((changes.status === "Decided" || changes.status === "Closed")
      && (nextState.currentStage < 4 || !hasText(nextState.decisionOutcome))) {
      return {
        validationError: "Kasus hanya dapat diputuskan atau ditutup setelah tahap Keputusan dan hasil keputusan dilengkapi.",
        missingItems: [{
          key: "decisionOutcome",
          label: "Hasil keputusan",
          target: "review-decision",
        }],
      };
    }
    const [item] = await tx.update(contractCasesTable).set(changes).where(eq(contractCasesTable.id, current.id)).returning();
    const reopened = stageChanged && changes.currentStage! < current.currentStage;
    const action = reopened ? "Tahap dibuka kembali" : stageChanged ? "Tahap diperbarui" : "Kasus diperbarui";
    const detail = changeNote?.trim() || (stageChanged
      ? `Tahap bergerak dari ${stageNames[current.currentStage] ?? current.currentStage} ke ${stageNames[changes.currentStage!] ?? changes.currentStage}.`
      : "Informasi kasus diperbarui.");
    await tx.insert(contractCaseActivitiesTable).values({
      caseId: item.id,
      organizationId: workspace.organizationId,
      action,
      detail,
      actor: item.owner ?? "Tim proyek",
    });
    if (hasNoticeDate) {
      const [deadline] = await tx.select().from(workItemsTable).where(and(
        eq(workItemsTable.organizationId, workspace.organizationId),
        eq(workItemsTable.caseId, item.id),
      )).limit(1);
      if (deadline) {
        await tx.update(workItemsTable).set({
          due: changes.noticeDueDate,
          reminderSentDays: [],
        }).where(and(
          eq(workItemsTable.id, deadline.id),
          eq(workItemsTable.organizationId, workspace.organizationId),
        ));
      } else if (changes.noticeDueDate) {
        await tx.insert(workItemsTable).values({
          organizationId: workspace.organizationId,
          category: "administration",
          title: `Kirim notice untuk ${item.reference}`,
          description: `Dasar klausul: ${item.clauseBasis}`,
          project: item.project,
          owner: item.owner,
          status: "Perlu ditinjau",
          due: changes.noticeDueDate,
          kind: `${item.type} Notice`,
          caseId: item.id,
          reminderDays: [14, 7, 3, 1],
        });
      }
    }
    return item;
  });
  if (!updated) {
    res.status(404).json({ error: "Kasus tidak ditemukan" });
    return;
  }
  if ("validationError" in updated) {
    res.status(400).json({ error: updated.validationError, missingItems: updated.missingItems });
    return;
  }
  res.json(UpdateContractCaseResponse.parse(withChecklist(updated)));
});

router.get("/contract-cases/:id/activities", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  const params = ListContractCaseActivitiesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const activities = await db.select({
    id: contractCaseActivitiesTable.id,
    action: contractCaseActivitiesTable.action,
    detail: contractCaseActivitiesTable.detail,
    actor: contractCaseActivitiesTable.actor,
    createdAt: contractCaseActivitiesTable.createdAt,
  }).from(contractCaseActivitiesTable).where(and(
    eq(contractCaseActivitiesTable.caseId, params.data.id),
    eq(contractCaseActivitiesTable.organizationId, workspace.organizationId),
  )).orderBy(asc(contractCaseActivitiesTable.createdAt));
  res.json(ListContractCaseActivitiesResponse.parse(activities));
});

export default router;