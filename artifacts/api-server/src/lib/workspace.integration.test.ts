import { afterEach, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import {
  appUsersTable,
  db,
  organizationInvitationsTable,
  organizationMembershipsTable,
  organizationsTable,
  workItemsTable,
} from "@workspace/db";
import { acceptWorkspaceInvitation, provisionWorkspaceForUser } from "./workspace";

const workItemIds: number[] = [];
const organizationIds: number[] = [];
const userIds: number[] = [];

afterEach(async () => {
  if (workItemIds.length) await db.delete(workItemsTable).where(inArray(workItemsTable.id, workItemIds.splice(0)));
  if (organizationIds.length) await db.delete(organizationsTable).where(inArray(organizationsTable.id, organizationIds.splice(0)));
  if (userIds.length) await db.delete(appUsersTable).where(inArray(appUsersTable.id, userIds.splice(0)));
});

function uniqueId(label: string) {
  return `test_${label}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

describe("organization workspace invariants", () => {
  it("provisions one workspace under concurrent first requests and claims legacy rows", async () => {
    const [legacy] = await db.insert(workItemsTable).values({
      organizationId: 0,
      category: "administration",
      title: uniqueId("legacy"),
      kind: "deadline",
    }).returning();
    workItemIds.push(legacy.id);

    const clerkUserId = uniqueId("concurrent_user");
    const contexts = await Promise.all([
      provisionWorkspaceForUser(clerkUserId),
      provisionWorkspaceForUser(clerkUserId),
      provisionWorkspaceForUser(clerkUserId),
    ]);
    const organizationId = contexts[0].organizationId;
    organizationIds.push(organizationId);
    userIds.push(contexts[0].userId);

    expect(new Set(contexts.map((context) => context.organizationId))).toEqual(new Set([organizationId]));
    const memberships = await db.select().from(organizationMembershipsTable)
      .where(eq(organizationMembershipsTable.userId, contexts[0].userId));
    expect(memberships).toHaveLength(1);
    const [claimed] = await db.select().from(workItemsTable).where(eq(workItemsTable.id, legacy.id));
    expect(claimed.organizationId).toBe(organizationId);
  });

  it("accepts an invitation once and rolls back token consumption on failure", async () => {
    const manager = await provisionWorkspaceForUser(uniqueId("manager"));
    const member = await provisionWorkspaceForUser(uniqueId("member"));
    organizationIds.push(manager.organizationId, member.organizationId);
    userIds.push(manager.userId, member.userId);

    const token = uniqueId("invite_token").padEnd(32, "x");
    const [invitation] = await db.insert(organizationInvitationsTable).values({
      organizationId: manager.organizationId,
      invitedByUserId: manager.userId,
      token,
      role: "member",
      expiresAt: new Date(Date.now() + 60_000),
    }).returning();

    await expect(acceptWorkspaceInvitation(2_000_000_000, token)).rejects.toThrow();
    const [afterRollback] = await db.select().from(organizationInvitationsTable)
      .where(eq(organizationInvitationsTable.id, invitation.id));
    expect(afterRollback.acceptedAt).toBeNull();

    const results = await Promise.all([
      acceptWorkspaceInvitation(member.userId, token),
      acceptWorkspaceInvitation(member.userId, token),
    ]);
    expect(results.filter((result) => result && !("alreadyMember" in result))).toHaveLength(1);
    expect(results.filter((result) => result === null)).toHaveLength(1);

    const memberships = await db.select().from(organizationMembershipsTable).where(and(
      eq(organizationMembershipsTable.organizationId, manager.organizationId),
      eq(organizationMembershipsTable.userId, member.userId),
    ));
    expect(memberships).toHaveLength(1);
    expect(memberships[0].role).toBe("member");
  });

  it("keeps list and update operations inside the active organization", async () => {
    const first = await provisionWorkspaceForUser(uniqueId("tenant_a"));
    const second = await provisionWorkspaceForUser(uniqueId("tenant_b"));
    organizationIds.push(first.organizationId, second.organizationId);
    userIds.push(first.userId, second.userId);

    const inserted = await db.insert(workItemsTable).values([
      { organizationId: first.organizationId, category: "evidence", title: uniqueId("tenant_a_item"), kind: "evidence" },
      { organizationId: second.organizationId, category: "evidence", title: uniqueId("tenant_b_item"), kind: "evidence" },
    ]).returning();
    workItemIds.push(...inserted.map((item) => item.id));

    const firstTenantItems = await db.select().from(workItemsTable)
      .where(eq(workItemsTable.organizationId, first.organizationId));
    expect(firstTenantItems.map((item) => item.id)).toEqual([inserted[0].id]);

    const crossTenantUpdate = await db.update(workItemsTable).set({ completed: true }).where(and(
      eq(workItemsTable.id, inserted[1].id),
      eq(workItemsTable.organizationId, first.organizationId),
    )).returning();
    expect(crossTenantUpdate).toHaveLength(0);
  });
});