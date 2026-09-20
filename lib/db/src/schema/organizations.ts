import { integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const organizationRoleEnum = pgEnum("organization_role", ["manager", "member"]);

export const organizationsTable = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const appUsersTable = pgTable("app_users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  displayName: text("display_name"),
  activeOrganizationId: integer("active_organization_id").references(() => organizationsTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("app_users_clerk_user_id_unique").on(table.clerkUserId),
]);

export const organizationMembershipsTable = pgTable("organization_memberships", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => appUsersTable.id, { onDelete: "cascade" }),
  role: organizationRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("organization_memberships_org_user_unique").on(table.organizationId, table.userId),
]);

export const organizationInvitationsTable = pgTable("organization_invitations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  invitedByUserId: integer("invited_by_user_id").notNull().references(() => appUsersTable.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  role: organizationRoleEnum("role").notNull().default("member"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("organization_invitations_token_unique").on(table.token),
]);

export const insertOrganizationSchema = createInsertSchema(organizationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizationsTable.$inferSelect;
export type OrganizationMembership = typeof organizationMembershipsTable.$inferSelect;