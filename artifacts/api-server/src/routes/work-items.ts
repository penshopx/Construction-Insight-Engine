import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { contractCaseActivitiesTable, db, workItemsTable } from "@workspace/db";
import {
  CreateWorkItemBody,
  CreateWorkItemResponse,
  ListWorkItemsQueryParams,
  ListWorkItemsResponse,
  UpdateWorkItemBody,
  UpdateWorkItemParams,
  UpdateWorkItemResponse,
} from "@workspace/api-zod";
import { requireWorkspace } from "../lib/workspace";
import { retainedReminderSentDays } from "../lib/notice-reminders";

const router: IRouter = Router();

router.get("/work-items", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  const query = ListWorkItemsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const items = query.data.category
    ? await db.select().from(workItemsTable).where(and(
        eq(workItemsTable.organizationId, workspace.organizationId),
        eq(workItemsTable.category, query.data.category),
      )).orderBy(desc(workItemsTable.createdAt))
    : await db.select().from(workItemsTable).where(eq(workItemsTable.organizationId, workspace.organizationId)).orderBy(desc(workItemsTable.createdAt));

  res.json(ListWorkItemsResponse.parse(items));
});

router.post("/work-items", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  const body = CreateWorkItemBody.safeParse(req.body);
  if (!body.success) {
    req.log.warn({ errors: body.error.message }, "Invalid work item");
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [item] = await db.insert(workItemsTable).values({
    ...body.data,
    organizationId: workspace.organizationId,
  }).returning();
  res.status(201).json(CreateWorkItemResponse.parse(item));
});

router.patch("/work-items/:id", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  const params = UpdateWorkItemParams.safeParse(req.params);
  const body = UpdateWorkItemBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const item = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(workItemsTable).where(and(
      eq(workItemsTable.id, params.data.id),
      eq(workItemsTable.organizationId, workspace.organizationId),
    )).limit(1);
    if (!current) return null;
    const reminderDaysChanged = body.data.reminderDays != null
      && JSON.stringify([...body.data.reminderDays].sort((a, b) => b - a))
        !== JSON.stringify([...current.reminderDays].sort((a, b) => b - a));
    const dueChanged = Object.prototype.hasOwnProperty.call(body.data, "due")
      && body.data.due !== current.due;
    const nextReminderDays = body.data.reminderDays ?? current.reminderDays;
    const [updated] = await tx.update(workItemsTable).set({
      ...body.data,
      ...(dueChanged || reminderDaysChanged
        ? { reminderSentDays: retainedReminderSentDays(current.reminderSentDays, nextReminderDays, dueChanged) }
        : {}),
    }).where(and(
      eq(workItemsTable.id, params.data.id),
      eq(workItemsTable.organizationId, workspace.organizationId),
    )).returning();
    if (current.caseId && (dueChanged || reminderDaysChanged || (!current.completed && updated.completed))) {
      await tx.insert(contractCaseActivitiesTable).values({
        caseId: current.caseId,
        organizationId: workspace.organizationId,
        action: dueChanged || reminderDaysChanged ? "Pengingat notice diperbarui" : "Tenggat notice diselesaikan",
        detail: dueChanged
          ? "Jadwal pengingat diulang karena tanggal tenggat notice berubah."
          : reminderDaysChanged
          ? `Pengingat dijadwalkan ${updated.reminderDays.length ? updated.reminderDays.map((day) => `${day} hari`).join(", ") : "tanpa ambang aktif"} sebelum tenggat.`
          : "Pengingat dihentikan karena tenggat telah ditandai selesai.",
        actor: updated.owner ?? "Tim proyek",
      });
    }
    return updated;
  });

  if (!item) {
    res.status(404).json({ error: "Item kerja tidak ditemukan" });
    return;
  }

  res.json(UpdateWorkItemResponse.parse(item));
});

export default router;