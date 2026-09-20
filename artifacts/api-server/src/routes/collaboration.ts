import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  collaborationActivitiesTable, contractCasesTable, db, expertAssignmentsTable, failureCasesTable,
  mediationEvidenceTable, mediationIssuesTable, mediationParticipantsTable,
  mediationRoomsTable, mediationSessionsTable,
} from "@workspace/db";
import {
  AddMediationEvidenceBody, AddMediationIssueBody, AddMediationParticipantBody,
  AddMediationSessionBody, CreateExpertAssignmentBody, CreateFailureCaseBody,
  CreateMediationRoomBody, GetMediationRoomParams, GetMediationRoomResponse,
  ListExpertAssignmentsResponse, ListFailureCasesResponse, ListMediationRoomsResponse,
  CreateFailureCaseResponse, CreateExpertAssignmentResponse, CreateMediationRoomResponse,
  UpdateExpertAssignmentResponse, UpdateMediationRoomResponse, AddMediationParticipantResponse,
  AddMediationSessionResponse, AddMediationIssueResponse, UpdateMediationIssueResponse,
  AddMediationEvidenceResponse,
  UpdateExpertAssignmentBody, UpdateExpertAssignmentParams, UpdateMediationIssueBody,
  UpdateMediationIssueParams, UpdateMediationRoomBody, UpdateMediationRoomParams,
} from "@workspace/api-zod";
import { requireWorkspace } from "../lib/workspace";

const router: IRouter = Router();
const id = (raw: string | string[]) => Number(Array.isArray(raw) ? raw[0] : raw);
const audit = async (organizationId: number, action: string, detail: string, actor: string | null, extra: { roomId?: number; failureCaseId?: number } = {}) => {
  await db.insert(collaborationActivitiesTable).values({ organizationId, action, detail, actor, ...extra });
};
const room = async (organizationId: number, roomId: number) => {
  const [value] = await db.select().from(mediationRoomsTable).where(and(eq(mediationRoomsTable.id, roomId), eq(mediationRoomsTable.organizationId, organizationId))).limit(1);
  return value;
};
const caseInWorkspace = async (organizationId: number, caseId: number) => {
  const [value] = await db.select({ id: contractCasesTable.id }).from(contractCasesTable)
    .where(and(eq(contractCasesTable.id, caseId), eq(contractCasesTable.organizationId, organizationId))).limit(1);
  return Boolean(value);
};
export const validEvidenceAccess = (confidentiality: string, allowedRoles: readonly string[]) => {
  if (!["ORGANIZATION", "RESTRICTED", "MANAGERS"].includes(confidentiality)) return false;
  if (confidentiality === "RESTRICTED" && allowedRoles.length === 0) return false;
  if (confidentiality === "MANAGERS" && allowedRoles.some((role) => role !== "manager")) return false;
  if (confidentiality === "ORGANIZATION" && allowedRoles.length > 0) return false;
  return allowedRoles.every((role) => role === "manager" || role === "member");
};
export type EvidenceVisibility = { confidentiality: string; allowedRoles: readonly string[] };
export const canViewEvidence = (item: EvidenceVisibility, role: "manager" | "member") =>
  item.confidentiality === "ORGANIZATION"
  || (item.confidentiality === "RESTRICTED" && item.allowedRoles.includes(role))
  || (item.confidentiality === "MANAGERS" && role === "manager");
export const referencesBelongToWorkspace = (
  references: Array<{ organizationId: number } | null | undefined>,
  organizationId: number,
) => references.every((reference) => reference?.organizationId === organizationId);

router.get("/collaboration/failure-cases", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  const values = await db.select().from(failureCasesTable).where(eq(failureCasesTable.organizationId, workspace.organizationId)).orderBy(desc(failureCasesTable.updatedAt));
  res.json(ListFailureCasesResponse.parse(values));
});

router.post("/collaboration/failure-cases", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  const body = CreateFailureCaseBody.safeParse(req.body); if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (body.data.caseId != null && !await caseInWorkspace(workspace.organizationId, body.data.caseId)) { res.status(400).json({ error: "Contract case tidak ditemukan dalam organisasi aktif" }); return; }
  const [value] = await db.insert(failureCasesTable).values({ ...body.data, eventDate: body.data.eventDate.toISOString().slice(0, 10), organizationId: workspace.organizationId, reference: `FLR-${Date.now()}` }).returning();
  await audit(workspace.organizationId, "Kasus kegagalan dibuat", "Data administrasi kasus kegagalan dicatat.", null, { failureCaseId: value.id });
  res.status(201).json(CreateFailureCaseResponse.parse(value));
});

router.get("/collaboration/expert-assignments", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  res.json(ListExpertAssignmentsResponse.parse(await db.select().from(expertAssignmentsTable).where(eq(expertAssignmentsTable.organizationId, workspace.organizationId)).orderBy(desc(expertAssignmentsTable.updatedAt))));
});

router.post("/collaboration/expert-assignments", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  const body = CreateExpertAssignmentBody.safeParse(req.body); if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (body.data.contractCaseId != null && !await caseInWorkspace(workspace.organizationId, body.data.contractCaseId)) { res.status(400).json({ error: "Contract case tidak ditemukan dalam organisasi aktif" }); return; }
  if (body.data.failureCaseId != null) {
    const [failure] = await db.select({ id: failureCasesTable.id }).from(failureCasesTable).where(and(eq(failureCasesTable.id, body.data.failureCaseId), eq(failureCasesTable.organizationId, workspace.organizationId))).limit(1);
    if (!failure) { res.status(400).json({ error: "Kasus kegagalan tidak ditemukan dalam organisasi aktif" }); return; }
  }
  const [value] = await db.insert(expertAssignmentsTable).values({ ...body.data, organizationId: workspace.organizationId }).returning();
  await audit(workspace.organizationId, "Penugasan ahli dibuat", "Ruang lingkup penugasan dicatat untuk ditinjau oleh para pihak.", null, { failureCaseId: body.data.failureCaseId });
  res.status(201).json(CreateExpertAssignmentResponse.parse(value));
});

router.patch("/collaboration/expert-assignments/:id", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  const params = UpdateExpertAssignmentParams.safeParse(req.params); const body = UpdateExpertAssignmentBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Permintaan penugasan tidak valid" }); return; }
  const changes: Record<string, unknown> = { ...body.data, updatedAt: new Date() };
  if (body.data.scopeAccepted) { changes.scopeAcceptedAt = new Date(); changes.status = "ACCEPTED"; delete changes.scopeAccepted; }
  const [value] = await db.update(expertAssignmentsTable).set(changes).where(and(eq(expertAssignmentsTable.id, params.data.id), eq(expertAssignmentsTable.organizationId, workspace.organizationId))).returning();
  if (!value) { res.status(404).json({ error: "Penugasan ahli tidak ditemukan" }); return; }
  await audit(workspace.organizationId, "Penugasan ahli diperbarui", "Penerimaan ruang lingkup atau deklarasi konflik dicatat sebagai aktivitas administratif.", null);
  res.json(UpdateExpertAssignmentResponse.parse(value));
});

router.get("/collaboration/mediation-rooms", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  res.json(ListMediationRoomsResponse.parse(await db.select().from(mediationRoomsTable).where(eq(mediationRoomsTable.organizationId, workspace.organizationId)).orderBy(desc(mediationRoomsTable.updatedAt))));
});

router.post("/collaboration/mediation-rooms", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  const body = CreateMediationRoomBody.safeParse(req.body); if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (body.data.contractCaseId != null && !await caseInWorkspace(workspace.organizationId, body.data.contractCaseId)) { res.status(400).json({ error: "Contract case tidak ditemukan dalam organisasi aktif" }); return; }
  if (body.data.failureCaseId != null) {
    const [failure] = await db.select({ id: failureCasesTable.id }).from(failureCasesTable).where(and(eq(failureCasesTable.id, body.data.failureCaseId), eq(failureCasesTable.organizationId, workspace.organizationId))).limit(1);
    if (!failure) { res.status(400).json({ error: "Kasus kegagalan tidak ditemukan dalam organisasi aktif" }); return; }
  }
  const [value] = await db.insert(mediationRoomsTable).values({ ...body.data, organizationId: workspace.organizationId, reference: `MED-${Date.now()}` }).returning();
  await audit(workspace.organizationId, "Ruang mediasi dibuat", "Ruang kolaborasi administratif dibuat; isinya bukan penetapan hukum.", null, { roomId: value.id });
  res.status(201).json(CreateMediationRoomResponse.parse(value));
});

router.get("/collaboration/mediation-rooms/:id", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  const params = GetMediationRoomParams.safeParse(req.params); if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const value = await room(workspace.organizationId, params.data.id); if (!value) { res.status(404).json({ error: "Ruang mediasi tidak ditemukan" }); return; }
  const [participants, sessions, issues, allEvidence, activities] = await Promise.all([
    db.select().from(mediationParticipantsTable).where(and(eq(mediationParticipantsTable.roomId, value.id), eq(mediationParticipantsTable.organizationId, workspace.organizationId))),
    db.select().from(mediationSessionsTable).where(and(eq(mediationSessionsTable.roomId, value.id), eq(mediationSessionsTable.organizationId, workspace.organizationId))),
    db.select().from(mediationIssuesTable).where(and(eq(mediationIssuesTable.roomId, value.id), eq(mediationIssuesTable.organizationId, workspace.organizationId))),
    db.select().from(mediationEvidenceTable).where(and(eq(mediationEvidenceTable.roomId, value.id), eq(mediationEvidenceTable.organizationId, workspace.organizationId))),
    db.select().from(collaborationActivitiesTable).where(and(eq(collaborationActivitiesTable.roomId, value.id), eq(collaborationActivitiesTable.organizationId, workspace.organizationId))).orderBy(asc(collaborationActivitiesTable.createdAt)),
  ]);
  const evidence = allEvidence.filter((item) => canViewEvidence(item, workspace.role));
  res.json(GetMediationRoomResponse.parse({ ...value, participants, sessions, issues, evidence, activities }));
});

router.patch("/collaboration/mediation-rooms/:id", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  const params = UpdateMediationRoomParams.safeParse(req.params); const body = UpdateMediationRoomBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Perubahan ruang tidak valid" }); return; }
  const [value] = await db.update(mediationRoomsTable).set({ ...body.data, updatedAt: new Date() }).where(and(eq(mediationRoomsTable.id, params.data.id), eq(mediationRoomsTable.organizationId, workspace.organizationId))).returning();
  if (!value) { res.status(404).json({ error: "Ruang mediasi tidak ditemukan" }); return; }
  await audit(workspace.organizationId, "Ruang mediasi diperbarui", "Catatan hasil atau draf kesepakatan diperbarui.", null, { roomId: value.id });
  res.json(UpdateMediationRoomResponse.parse(value));
});

router.post("/collaboration/mediation-rooms/:id/participants", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); const roomId = id(req.params.id); if (!workspace) return;
  const body = AddMediationParticipantBody.safeParse(req.body); if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (!await room(workspace.organizationId, roomId)) { res.status(404).json({ error: "Ruang mediasi tidak ditemukan" }); return; }
  const [value] = await db.insert(mediationParticipantsTable).values({ ...body.data, roomId, organizationId: workspace.organizationId }).returning();
  await audit(workspace.organizationId, "Peserta ruang ditambahkan", "Peran dan tingkat akses peserta dicatat.", null, { roomId });
  res.status(201).json(AddMediationParticipantResponse.parse(value));
});

router.post("/collaboration/mediation-rooms/:id/sessions", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); const roomId = id(req.params.id); if (!workspace) return;
  const body = AddMediationSessionBody.safeParse(req.body); if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (!await room(workspace.organizationId, roomId)) { res.status(404).json({ error: "Ruang mediasi tidak ditemukan" }); return; }
  const [value] = await db.insert(mediationSessionsTable).values({ ...body.data, roomId, organizationId: workspace.organizationId }).returning();
  await audit(workspace.organizationId, "Sesi mediasi ditambahkan", "Agenda sesi dicatat untuk koordinasi para pihak.", null, { roomId });
  res.status(201).json(AddMediationSessionResponse.parse(value));
});

router.post("/collaboration/mediation-rooms/:id/issues", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); const roomId = id(req.params.id); if (!workspace) return;
  const body = AddMediationIssueBody.safeParse(req.body); if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (!await room(workspace.organizationId, roomId)) { res.status(404).json({ error: "Ruang mediasi tidak ditemukan" }); return; }
  const [value] = await db.insert(mediationIssuesTable).values({ ...body.data, roomId, organizationId: workspace.organizationId }).returning();
  await audit(workspace.organizationId, "Pokok sengketa ditambahkan", "Posisi para pihak dicatat sebagai bahan pembahasan, bukan kesimpulan hukum.", null, { roomId });
  res.status(201).json(AddMediationIssueResponse.parse(value));
});

router.patch("/collaboration/mediation-issues/:id", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  const params = UpdateMediationIssueParams.safeParse(req.params); const body = UpdateMediationIssueBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Perubahan isu tidak valid" }); return; }
  const [value] = await db.update(mediationIssuesTable).set({ ...body.data, updatedAt: new Date() }).where(and(eq(mediationIssuesTable.id, params.data.id), eq(mediationIssuesTable.organizationId, workspace.organizationId))).returning();
  if (!value) { res.status(404).json({ error: "Isu tidak ditemukan" }); return; }
  await audit(workspace.organizationId, "Pokok sengketa diperbarui", "Posisi atau catatan resolusi diperbarui.", null, { roomId: value.roomId });
  res.json(UpdateMediationIssueResponse.parse(value));
});

router.post("/collaboration/mediation-rooms/:id/evidence", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); const roomId = id(req.params.id); if (!workspace) return;
  const body = AddMediationEvidenceBody.safeParse(req.body); if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (!await room(workspace.organizationId, roomId)) { res.status(404).json({ error: "Ruang mediasi tidak ditemukan" }); return; }
  const confidentiality = body.data.confidentiality ?? "ORGANIZATION";
  const allowedRoles = body.data.allowedRoles ?? [];
  if (!validEvidenceAccess(confidentiality, allowedRoles)) { res.status(400).json({ error: "Kombinasi kerahasiaan dan peran akses bukti tidak valid" }); return; }
  const [value] = await db.insert(mediationEvidenceTable).values({ ...body.data, confidentiality, allowedRoles, roomId, organizationId: workspace.organizationId, uploadedBy: String(workspace.userId) }).returning();
  await audit(workspace.organizationId, "Bukti ruang ditambahkan", `Akses bukti dibatasi menurut kerahasiaan ${confidentiality} dan peran yang disetujui.`, String(workspace.userId), { roomId });
  res.status(201).json(AddMediationEvidenceResponse.parse(value));
});

export default router;