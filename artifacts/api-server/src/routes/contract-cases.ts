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
  res.json(ListContractCasesResponse.parse(cases));
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
      });
    }
    return created;
  });
  res.status(201).json(CreateContractCaseResponse.parse(item));
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
    const [item] = await tx.update(contractCasesTable).set(changes).where(eq(contractCasesTable.id, current.id)).returning();
    const stageChanged = changes.currentStage != null && changes.currentStage !== current.currentStage;
    const action = stageChanged ? "Tahap diperbarui" : "Kasus diperbarui";
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
        await tx.update(workItemsTable).set({ due: changes.noticeDueDate }).where(eq(workItemsTable.id, deadline.id));
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
        });
      }
    }
    return item;
  });
  if (!updated) {
    res.status(404).json({ error: "Kasus tidak ditemukan" });
    return;
  }
  res.json(UpdateContractCaseResponse.parse(updated));
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