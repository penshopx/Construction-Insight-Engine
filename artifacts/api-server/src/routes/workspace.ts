import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, organizationInvitationsTable, organizationMembershipsTable, organizationsTable, appUsersTable } from "@workspace/db";
import {
  AcceptWorkspaceInvitationBody,
  AcceptWorkspaceInvitationResponse,
  CreateWorkspaceInvitationResponse,
  GetWorkspaceResponse,
  ListWorkspaceMembersResponse,
  UpdateWorkspaceBody,
  UpdateWorkspaceResponse,
} from "@workspace/api-zod";
import { acceptWorkspaceInvitation, requireWorkspace } from "../lib/workspace";

const router: IRouter = Router();

router.get("/workspace", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  res.json(GetWorkspaceResponse.parse({
    id: workspace.organizationId,
    name: workspace.organizationName,
    role: workspace.role,
  }));
});

router.patch("/workspace", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  if (workspace.role !== "manager") {
    res.status(403).json({ error: "Hanya pengelola yang dapat mengubah ruang kerja" });
    return;
  }
  const body = UpdateWorkspaceBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [organization] = await db.update(organizationsTable)
    .set({ name: body.data.name })
    .where(eq(organizationsTable.id, workspace.organizationId))
    .returning();
  res.json(UpdateWorkspaceResponse.parse({ id: organization.id, name: organization.name, role: workspace.role }));
});

router.get("/workspace/members", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  const members = await db.select({
    id: appUsersTable.id,
    displayName: appUsersTable.displayName,
    role: organizationMembershipsTable.role,
  }).from(organizationMembershipsTable)
    .innerJoin(appUsersTable, eq(organizationMembershipsTable.userId, appUsersTable.id))
    .where(eq(organizationMembershipsTable.organizationId, workspace.organizationId));
  res.json(ListWorkspaceMembersResponse.parse(members));
});

router.post("/workspace/invitations", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  if (workspace.role !== "manager") {
    res.status(403).json({ error: "Hanya pengelola yang dapat mengundang anggota" });
    return;
  }
  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [invitation] = await db.insert(organizationInvitationsTable).values({
    organizationId: workspace.organizationId,
    invitedByUserId: workspace.userId,
    token,
    role: "member",
    expiresAt,
  }).returning();
  res.status(201).json(CreateWorkspaceInvitationResponse.parse(invitation));
});

router.post("/workspace/invitations/accept", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  const body = AcceptWorkspaceInvitationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const result = await acceptWorkspaceInvitation(workspace.userId, body.data.token);

  if (!result) {
    res.status(400).json({ error: "Undangan tidak valid, sudah digunakan, atau kedaluwarsa" });
    return;
  }
  if ("alreadyMember" in result) {
    res.status(400).json({ error: "Anda sudah berada di ruang kerja ini" });
    return;
  }
  res.json(AcceptWorkspaceInvitationResponse.parse({
    id: result.organization.id,
    name: result.organization.name,
    role: result.role,
  }));
});

export default router;