import { getAuth } from "@clerk/express";
import type { Request, Response } from "express";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import {
  appUsersTable,
  db,
  organizationInvitationsTable,
  organizationMembershipsTable,
  organizationsTable,
  workItemsTable,
} from "@workspace/db";

export type WorkspaceContext = {
  userId: number;
  organizationId: number;
  organizationName: string;
  role: "manager" | "member";
};

export async function provisionWorkspaceForUser(clerkUserId: string): Promise<WorkspaceContext> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${clerkUserId}))`);

    let [user] = await tx.select().from(appUsersTable).where(eq(appUsersTable.clerkUserId, clerkUserId)).limit(1);
    if (!user) {
      [user] = await tx.insert(appUsersTable).values({ clerkUserId }).onConflictDoNothing().returning();
      if (!user) {
        [user] = await tx.select().from(appUsersTable).where(eq(appUsersTable.clerkUserId, clerkUserId)).limit(1);
      }
    }

    let [membership] = await tx
      .select({
        organizationId: organizationMembershipsTable.organizationId,
        organizationName: organizationsTable.name,
        role: organizationMembershipsTable.role,
      })
      .from(organizationMembershipsTable)
      .innerJoin(organizationsTable, eq(organizationMembershipsTable.organizationId, organizationsTable.id))
      .where(user.activeOrganizationId
        ? and(
            eq(organizationMembershipsTable.userId, user.id),
            eq(organizationMembershipsTable.organizationId, user.activeOrganizationId),
          )
        : eq(organizationMembershipsTable.userId, user.id))
      .limit(1);

    if (!membership) {
      const [organization] = await tx.insert(organizationsTable).values({ name: "Ruang Kerja Perusahaan" }).returning();
      await tx.insert(organizationMembershipsTable).values({
        organizationId: organization.id,
        userId: user.id,
        role: "manager",
      });
      await tx.update(appUsersTable)
        .set({ activeOrganizationId: organization.id })
        .where(eq(appUsersTable.id, user.id));
      await tx.update(workItemsTable)
        .set({ organizationId: organization.id })
        .where(eq(workItemsTable.organizationId, 0));
      membership = { organizationId: organization.id, organizationName: organization.name, role: "manager" };
    } else if (!user.activeOrganizationId) {
      await tx.update(appUsersTable)
        .set({ activeOrganizationId: membership.organizationId })
        .where(eq(appUsersTable.id, user.id));
    }

    return { userId: user.id, ...membership };
  });
}

export async function acceptWorkspaceInvitation(userId: number, token: string) {
  return db.transaction(async (tx) => {
    const [candidate] = await tx.select().from(organizationInvitationsTable).where(and(
      eq(organizationInvitationsTable.token, token),
      isNull(organizationInvitationsTable.acceptedAt),
      gt(organizationInvitationsTable.expiresAt, new Date()),
    )).limit(1);
    if (!candidate) return null;

    const [existingMembership] = await tx.select({ id: organizationMembershipsTable.id })
      .from(organizationMembershipsTable)
      .where(and(
        eq(organizationMembershipsTable.organizationId, candidate.organizationId),
        eq(organizationMembershipsTable.userId, userId),
      )).limit(1);
    if (existingMembership) return { alreadyMember: true as const };

    const [invitation] = await tx.update(organizationInvitationsTable)
      .set({ acceptedAt: new Date() })
      .where(and(
        eq(organizationInvitationsTable.id, candidate.id),
        isNull(organizationInvitationsTable.acceptedAt),
      )).returning();
    if (!invitation) return null;

    await tx.insert(organizationMembershipsTable).values({
      organizationId: invitation.organizationId,
      userId,
      role: invitation.role,
    });
    await tx.update(appUsersTable).set({ activeOrganizationId: invitation.organizationId })
      .where(eq(appUsersTable.id, userId));
    const [organization] = await tx.select().from(organizationsTable)
      .where(eq(organizationsTable.id, invitation.organizationId)).limit(1);
    return { organization, role: invitation.role };
  });
}

export async function requireWorkspace(req: Request, res: Response): Promise<WorkspaceContext | null> {
  const clerkUserId = getAuth(req)?.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Silakan masuk untuk melanjutkan" });
    return null;
  }
  return provisionWorkspaceForUser(clerkUserId);
}