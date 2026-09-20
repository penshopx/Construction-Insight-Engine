import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, organizationInvitationsTable, organizationMembershipsTable, organizationReminderSettingsTable, organizationsTable, appUsersTable } from "@workspace/db";
import {
  AcceptWorkspaceInvitationBody,
  AcceptWorkspaceInvitationResponse,
  CreateWorkspaceInvitationResponse,
  GetWorkspaceResponse,
  ListWorkspaceMembersResponse,
  GetReminderSettingsResponse,
  UpdateReminderSettingsBody,
  UpdateReminderSettingsResponse,
  UpdateWorkspaceBody,
  UpdateWorkspaceResponse,
} from "@workspace/api-zod";
import { acceptWorkspaceInvitation, requireWorkspace } from "../lib/workspace";
import { encryptCredential } from "../lib/credential-crypto";

const router: IRouter = Router();

function reminderSettingsResponse(settings?: typeof organizationReminderSettingsTable.$inferSelect) {
  return {
    emailEnabled: settings?.emailEnabled ?? false,
    emailRecipients: settings?.emailRecipients ?? [],
    emailFrom: settings?.emailFrom ?? null,
    emailCredentialConfigured: Boolean(settings?.emailTokenEncrypted),
    whatsappEnabled: settings?.whatsappEnabled ?? false,
    whatsappRecipients: settings?.whatsappRecipients ?? [],
    whatsappPhoneNumberId: settings?.whatsappPhoneNumberId ?? null,
    whatsappTemplateName: settings?.whatsappTemplateName ?? null,
    whatsappTemplateLanguage: settings?.whatsappTemplateLanguage ?? "id",
    whatsappCredentialConfigured: Boolean(settings?.whatsappTokenEncrypted),
  };
}

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

router.get("/workspace/reminder-settings", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  const [settings] = await db.select().from(organizationReminderSettingsTable)
    .where(eq(organizationReminderSettingsTable.organizationId, workspace.organizationId)).limit(1);
  res.json(GetReminderSettingsResponse.parse(reminderSettingsResponse(settings)));
});

router.patch("/workspace/reminder-settings", async (req, res): Promise<void> => {
  const workspace = await requireWorkspace(req, res);
  if (!workspace) return;
  if (workspace.role !== "manager") {
    res.status(403).json({ error: "Hanya pengelola yang dapat mengatur kanal pengingat" });
    return;
  }
  const body = UpdateReminderSettingsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [current] = await db.select().from(organizationReminderSettingsTable)
    .where(eq(organizationReminderSettingsTable.organizationId, workspace.organizationId)).limit(1);
  const next = {
    emailEnabled: body.data.emailEnabled ?? current?.emailEnabled ?? false,
    emailRecipients: body.data.emailRecipients ?? current?.emailRecipients ?? [],
    emailFrom: body.data.emailFrom ?? current?.emailFrom ?? null,
    emailCredentialConfigured: Boolean(body.data.emailToken || current?.emailTokenEncrypted),
    whatsappEnabled: body.data.whatsappEnabled ?? current?.whatsappEnabled ?? false,
    whatsappRecipients: body.data.whatsappRecipients ?? current?.whatsappRecipients ?? [],
    whatsappPhoneNumberId: body.data.whatsappPhoneNumberId ?? current?.whatsappPhoneNumberId ?? null,
    whatsappTemplateName: body.data.whatsappTemplateName ?? current?.whatsappTemplateName ?? null,
    whatsappTemplateLanguage: body.data.whatsappTemplateLanguage ?? current?.whatsappTemplateLanguage ?? "id",
    whatsappCredentialConfigured: Boolean(body.data.whatsappToken || current?.whatsappTokenEncrypted),
  };
  if (next.emailEnabled && (!next.emailRecipients.length || !next.emailFrom || !next.emailCredentialConfigured)) {
    res.status(400).json({ error: "Lengkapi penerima, alamat pengirim, dan token Resend sebelum mengaktifkan email" });
    return;
  }
  if (next.whatsappEnabled && (!next.whatsappRecipients.length || !next.whatsappPhoneNumberId || !next.whatsappTemplateName || !next.whatsappCredentialConfigured)) {
    res.status(400).json({ error: "Lengkapi penerima, phone number ID, template pesan, dan token Meta sebelum mengaktifkan WhatsApp" });
    return;
  }
  const values = {
    ...body.data,
    ...(body.data.emailToken ? { emailTokenEncrypted: encryptCredential(body.data.emailToken) } : {}),
    ...(body.data.whatsappToken ? { whatsappTokenEncrypted: encryptCredential(body.data.whatsappToken) } : {}),
  };
  delete (values as { emailToken?: string }).emailToken;
  delete (values as { whatsappToken?: string }).whatsappToken;
  const [settings] = await db.insert(organizationReminderSettingsTable).values({
    organizationId: workspace.organizationId,
    ...values,
  }).onConflictDoUpdate({
    target: organizationReminderSettingsTable.organizationId,
    set: values,
  }).returning();
  res.json(UpdateReminderSettingsResponse.parse(reminderSettingsResponse(settings)));
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