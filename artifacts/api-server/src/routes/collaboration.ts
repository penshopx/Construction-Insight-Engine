import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  appUsersTable, collaborationActivitiesTable, contractCasesTable, db, expertAssignmentsTable, failureCasesTable,
  mediationEvidenceTable, mediationIssuesTable, mediationParticipantsTable,
  mediationRoomsTable, mediationSessionsTable, organizationMembershipsTable,
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
export type MediationRole = "CLAIMANT" | "RESPONDENT" | "MEDIATOR" | "OBSERVER";
const mediationRoles = ["CLAIMANT", "RESPONDENT", "MEDIATOR", "OBSERVER"] as const;
const participant = async (organizationId: number, roomId: number, userId: number) => {
  const [value] = await db.select().from(mediationParticipantsTable).where(and(
    eq(mediationParticipantsTable.organizationId, organizationId),
    eq(mediationParticipantsTable.roomId, roomId),
    eq(mediationParticipantsTable.userId, userId),
  )).limit(1);
  return value;
};
const requireParticipant = async (
  res: Parameters<typeof requireWorkspace>[1],
  organizationId: number,
  roomId: number,
  userId: number,
) => {
  const value = await participant(organizationId, roomId, userId);
  if (!value) res.status(403).json({ error: "Anda bukan peserta ruang mediasi ini" });
  return value;
};
export const canChangeMediationRoom = (role: MediationRole) => role === "MEDIATOR";
export const canContributeToMediation = (role: MediationRole) => role !== "OBSERVER";
const caseInWorkspace = async (organizationId: number, caseId: number) => {
  const [value] = await db.select({ id: contractCasesTable.id }).from(contractCasesTable)
    .where(and(eq(contractCasesTable.id, caseId), eq(contractCasesTable.organizationId, organizationId))).limit(1);
  return Boolean(value);
};
export const validEvidenceAccess = (confidentiality: string, allowedRoles: readonly string[], allowedParticipantIds: readonly number[]) => {
  if (!["ROOM", "RESTRICTED"].includes(confidentiality)) return false;
  if (new Set(allowedRoles).size !== allowedRoles.length || new Set(allowedParticipantIds).size !== allowedParticipantIds.length) return false;
  if (confidentiality === "RESTRICTED" && allowedRoles.length === 0 && allowedParticipantIds.length === 0) return false;
  if (confidentiality === "ROOM" && (allowedRoles.length > 0 || allowedParticipantIds.length > 0)) return false;
  return allowedRoles.every((role) => mediationRoles.includes(role as MediationRole))
    && allowedParticipantIds.every((participantId) => Number.isInteger(participantId) && participantId > 0);
};
export type EvidenceVisibility = { confidentiality: string; allowedParticipantRoles: readonly string[]; allowedParticipantIds: readonly number[] };
export const canViewEvidence = (item: EvidenceVisibility, viewer: { id: number; role: MediationRole }) =>
  item.confidentiality === "ROOM"
  || (item.confidentiality === "RESTRICTED"
    && (item.allowedParticipantRoles.includes(viewer.role) || item.allowedParticipantIds.includes(viewer.id)));
export const listVisibleEvidence = async (
  organizationId: number,
  roomId: number,
  viewer: { id: number; role: MediationRole },
) => {
  const evidence = await db.select().from(mediationEvidenceTable).where(and(
    eq(mediationEvidenceTable.roomId, roomId),
    eq(mediationEvidenceTable.organizationId, organizationId),
  ));
  return evidence.filter((item) => canViewEvidence(item, viewer));
};

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
  const values = await db.select({ room: mediationRoomsTable }).from(mediationRoomsTable)
    .innerJoin(mediationParticipantsTable, and(
      eq(mediationParticipantsTable.roomId, mediationRoomsTable.id),
      eq(mediationParticipantsTable.userId, workspace.userId),
    ))
    .where(eq(mediationRoomsTable.organizationId, workspace.organizationId))
    .orderBy(desc(mediationRoomsTable.updatedAt));
  res.json(ListMediationRoomsResponse.parse(values.map(({ room: value }) => value)));
});

router.post("/collaboration/mediation-rooms", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  const body = CreateMediationRoomBody.safeParse(req.body); if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (body.data.contractCaseId != null && !await caseInWorkspace(workspace.organizationId, body.data.contractCaseId)) { res.status(400).json({ error: "Contract case tidak ditemukan dalam organisasi aktif" }); return; }
  if (body.data.failureCaseId != null) {
    const [failure] = await db.select({ id: failureCasesTable.id }).from(failureCasesTable).where(and(eq(failureCasesTable.id, body.data.failureCaseId), eq(failureCasesTable.organizationId, workspace.organizationId))).limit(1);
    if (!failure) { res.status(400).json({ error: "Kasus kegagalan tidak ditemukan dalam organisasi aktif" }); return; }
  }
  const value = await db.transaction(async (tx) => {
    const [created] = await tx.insert(mediationRoomsTable).values({ ...body.data, organizationId: workspace.organizationId, reference: `MED-${Date.now()}` }).returning();
    const [creator] = await tx.select({ displayName: appUsersTable.displayName }).from(appUsersTable).where(eq(appUsersTable.id, workspace.userId)).limit(1);
    await tx.insert(mediationParticipantsTable).values({
      organizationId: workspace.organizationId,
      roomId: created.id,
      userId: workspace.userId,
      displayName: creator?.displayName || "Pembuat ruang",
      role: "MEDIATOR",
    });
    return created;
  });
  await audit(workspace.organizationId, "Ruang mediasi dibuat", "Ruang kolaborasi administratif dibuat; isinya bukan penetapan hukum.", null, { roomId: value.id });
  res.status(201).json(CreateMediationRoomResponse.parse(value));
});

router.get("/collaboration/mediation-rooms/:id", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  const params = GetMediationRoomParams.safeParse(req.params); if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const value = await room(workspace.organizationId, params.data.id); if (!value) { res.status(404).json({ error: "Ruang mediasi tidak ditemukan" }); return; }
  const viewer = await requireParticipant(res, workspace.organizationId, value.id, workspace.userId); if (!viewer) return;
  const [participants, sessions, issues, evidence, activities] = await Promise.all([
    db.select().from(mediationParticipantsTable).where(and(eq(mediationParticipantsTable.roomId, value.id), eq(mediationParticipantsTable.organizationId, workspace.organizationId))),
    db.select().from(mediationSessionsTable).where(and(eq(mediationSessionsTable.roomId, value.id), eq(mediationSessionsTable.organizationId, workspace.organizationId))),
    db.select().from(mediationIssuesTable).where(and(eq(mediationIssuesTable.roomId, value.id), eq(mediationIssuesTable.organizationId, workspace.organizationId))),
    listVisibleEvidence(workspace.organizationId, value.id, { id: viewer.id, role: viewer.role as MediationRole }),
    db.select().from(collaborationActivitiesTable).where(and(eq(collaborationActivitiesTable.roomId, value.id), eq(collaborationActivitiesTable.organizationId, workspace.organizationId))).orderBy(asc(collaborationActivitiesTable.createdAt)),
  ]);
  res.json(GetMediationRoomResponse.parse({
    ...value,
    viewerParticipantId: viewer.id,
    viewerRole: viewer.role,
    participants,
    sessions,
    issues,
    evidence,
    activities,
  }));
});

router.patch("/collaboration/mediation-rooms/:id", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  const params = UpdateMediationRoomParams.safeParse(req.params); const body = UpdateMediationRoomBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Perubahan ruang tidak valid" }); return; }
  const viewer = await requireParticipant(res, workspace.organizationId, params.data.id, workspace.userId); if (!viewer) return;
  if (!canChangeMediationRoom(viewer.role as MediationRole)) { res.status(403).json({ error: "Hanya mediator yang dapat mengubah ruang mediasi" }); return; }
  const [value] = await db.update(mediationRoomsTable).set({ ...body.data, updatedAt: new Date() }).where(and(eq(mediationRoomsTable.id, params.data.id), eq(mediationRoomsTable.organizationId, workspace.organizationId))).returning();
  if (!value) { res.status(404).json({ error: "Ruang mediasi tidak ditemukan" }); return; }
  await audit(workspace.organizationId, "Ruang mediasi diperbarui", "Catatan hasil atau draf kesepakatan diperbarui.", null, { roomId: value.id });
  res.json(UpdateMediationRoomResponse.parse(value));
});

router.post("/collaboration/mediation-rooms/:id/participants", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); const roomId = id(req.params.id); if (!workspace) return;
  const body = AddMediationParticipantBody.safeParse(req.body); if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (!await room(workspace.organizationId, roomId)) { res.status(404).json({ error: "Ruang mediasi tidak ditemukan" }); return; }
  const viewer = await requireParticipant(res, workspace.organizationId, roomId, workspace.userId); if (!viewer) return;
  if (!canChangeMediationRoom(viewer.role as MediationRole)) { res.status(403).json({ error: "Hanya mediator yang dapat menambahkan peserta" }); return; }
  const [member] = await db.select({ id: appUsersTable.id, displayName: appUsersTable.displayName })
    .from(organizationMembershipsTable)
    .innerJoin(appUsersTable, eq(organizationMembershipsTable.userId, appUsersTable.id))
    .where(and(eq(organizationMembershipsTable.organizationId, workspace.organizationId), eq(appUsersTable.id, body.data.userId))).limit(1);
  if (!member) { res.status(400).json({ error: "Anggota tidak ditemukan dalam organisasi aktif" }); return; }
  const [value] = await db.insert(mediationParticipantsTable).values({
    ...body.data,
    displayName: member.displayName || `Anggota ${member.id}`,
    roomId,
    organizationId: workspace.organizationId,
  }).onConflictDoNothing().returning();
  if (!value) { res.status(409).json({ error: "Anggota tersebut sudah menjadi peserta ruang" }); return; }
  await audit(workspace.organizationId, "Peserta ruang ditambahkan", "Peran dan tingkat akses peserta dicatat.", null, { roomId });
  res.status(201).json(AddMediationParticipantResponse.parse(value));
});

router.post("/collaboration/mediation-rooms/:id/sessions", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); const roomId = id(req.params.id); if (!workspace) return;
  const body = AddMediationSessionBody.safeParse(req.body); if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (!await room(workspace.organizationId, roomId)) { res.status(404).json({ error: "Ruang mediasi tidak ditemukan" }); return; }
  const viewer = await requireParticipant(res, workspace.organizationId, roomId, workspace.userId); if (!viewer) return;
  if (!canChangeMediationRoom(viewer.role as MediationRole)) { res.status(403).json({ error: "Hanya mediator yang dapat menambahkan sesi" }); return; }
  const [value] = await db.insert(mediationSessionsTable).values({ ...body.data, roomId, organizationId: workspace.organizationId }).returning();
  await audit(workspace.organizationId, "Sesi mediasi ditambahkan", "Agenda sesi dicatat untuk koordinasi para pihak.", null, { roomId });
  res.status(201).json(AddMediationSessionResponse.parse(value));
});

router.post("/collaboration/mediation-rooms/:id/issues", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); const roomId = id(req.params.id); if (!workspace) return;
  const body = AddMediationIssueBody.safeParse(req.body); if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (!await room(workspace.organizationId, roomId)) { res.status(404).json({ error: "Ruang mediasi tidak ditemukan" }); return; }
  const viewer = await requireParticipant(res, workspace.organizationId, roomId, workspace.userId); if (!viewer) return;
  if (!canContributeToMediation(viewer.role as MediationRole)) { res.status(403).json({ error: "Pengamat hanya memiliki akses baca" }); return; }
  const [value] = await db.insert(mediationIssuesTable).values({ ...body.data, roomId, organizationId: workspace.organizationId }).returning();
  await audit(workspace.organizationId, "Pokok sengketa ditambahkan", "Posisi para pihak dicatat sebagai bahan pembahasan, bukan kesimpulan hukum.", null, { roomId });
  res.status(201).json(AddMediationIssueResponse.parse(value));
});

router.patch("/collaboration/mediation-issues/:id", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); if (!workspace) return;
  const params = UpdateMediationIssueParams.safeParse(req.params); const body = UpdateMediationIssueBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Perubahan isu tidak valid" }); return; }
  const [issue] = await db.select({ roomId: mediationIssuesTable.roomId }).from(mediationIssuesTable).where(and(eq(mediationIssuesTable.id, params.data.id), eq(mediationIssuesTable.organizationId, workspace.organizationId))).limit(1);
  if (!issue) { res.status(404).json({ error: "Isu tidak ditemukan" }); return; }
  const viewer = await requireParticipant(res, workspace.organizationId, issue.roomId, workspace.userId); if (!viewer) return;
  if (!canContributeToMediation(viewer.role as MediationRole)) { res.status(403).json({ error: "Pengamat hanya memiliki akses baca" }); return; }
  const [value] = await db.update(mediationIssuesTable).set({ ...body.data, updatedAt: new Date() }).where(and(eq(mediationIssuesTable.id, params.data.id), eq(mediationIssuesTable.organizationId, workspace.organizationId))).returning();
  if (!value) { res.status(404).json({ error: "Isu tidak ditemukan" }); return; }
  await audit(workspace.organizationId, "Pokok sengketa diperbarui", "Posisi atau catatan resolusi diperbarui.", null, { roomId: value.roomId });
  res.json(UpdateMediationIssueResponse.parse(value));
});

router.post("/collaboration/mediation-rooms/:id/evidence", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res); const roomId = id(req.params.id); if (!workspace) return;
  const body = AddMediationEvidenceBody.safeParse(req.body); if (!body.success) { res.status(400).json({ error: body.error.message }); return; }
  if (!await room(workspace.organizationId, roomId)) { res.status(404).json({ error: "Ruang mediasi tidak ditemukan" }); return; }
  const viewer = await requireParticipant(res, workspace.organizationId, roomId, workspace.userId); if (!viewer) return;
  if (!canContributeToMediation(viewer.role as MediationRole)) { res.status(403).json({ error: "Pengamat hanya memiliki akses baca" }); return; }
  const confidentiality = body.data.confidentiality ?? "ROOM";
  const allowedParticipantRoles = body.data.allowedParticipantRoles ?? [];
  const allowedParticipantIds = body.data.allowedParticipantIds ?? [];
  if (!validEvidenceAccess(confidentiality, allowedParticipantRoles, allowedParticipantIds)) { res.status(400).json({ error: "Pembatasan akses bukti tidak valid" }); return; }
  if (allowedParticipantIds.length) {
    const allowed = await db.select({ id: mediationParticipantsTable.id }).from(mediationParticipantsTable).where(and(
      eq(mediationParticipantsTable.organizationId, workspace.organizationId),
      eq(mediationParticipantsTable.roomId, roomId),
    ));
    const roomParticipantIds = new Set(allowed.map(({ id: participantId }) => participantId));
    if (allowedParticipantIds.some((participantId) => !roomParticipantIds.has(participantId))) { res.status(400).json({ error: "Peserta yang dipilih tidak berada dalam ruang mediasi" }); return; }
  }
  const [value] = await db.insert(mediationEvidenceTable).values({ ...body.data, confidentiality, allowedParticipantRoles, allowedParticipantIds, roomId, organizationId: workspace.organizationId, uploadedBy: String(workspace.userId) }).returning();
  await audit(workspace.organizationId, "Bukti ruang ditambahkan", `Akses bukti dibatasi menurut kerahasiaan ${confidentiality} dan peran yang disetujui.`, String(workspace.userId), { roomId });
  res.status(201).json(AddMediationEvidenceResponse.parse(value));
});

export default router;