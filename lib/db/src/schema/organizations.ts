import { boolean, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
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

export const organizationReminderSettingsTable = pgTable("organization_reminder_settings", {
  organizationId: integer("organization_id").primaryKey().references(() => organizationsTable.id, { onDelete: "cascade" }),
  emailEnabled: boolean("email_enabled").notNull().default(false),
  emailRecipients: jsonb("email_recipients").$type<string[]>().notNull().default([]),
  emailFrom: text("email_from"),
  emailTokenEncrypted: text("email_token_encrypted"),
  whatsappEnabled: boolean("whatsapp_enabled").notNull().default(false),
  whatsappRecipients: jsonb("whatsapp_recipients").$type<string[]>().notNull().default([]),
  whatsappPhoneNumberId: text("whatsapp_phone_number_id"),
  whatsappTemplateName: text("whatsapp_template_name"),
  whatsappTemplateLanguage: text("whatsapp_template_language").notNull().default("id"),
  whatsappTokenEncrypted: text("whatsapp_token_encrypted"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const noticeReminderDeliveriesTable = pgTable("notice_reminder_deliveries", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
  workItemId: integer("work_item_id").notNull(),
  caseId: integer("case_id").notNull(),
  reminderDay: integer("reminder_day").notNull(),
  channel: text("channel").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  leaseToken: text("lease_token"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("notice_reminder_delivery_unique").on(table.workItemId, table.reminderDay, table.channel, table.recipient),
  index("notice_reminder_delivery_status_idx").on(table.status, table.nextAttemptAt),
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