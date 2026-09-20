import { date, index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { appUsersTable } from "./organizations";

export const failureCasesTable = pgTable("failure_cases", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  caseId: integer("case_id"),
  project: text("project").notNull(),
  reference: text("reference").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  severity: text("severity").notNull().default("Sedang"),
  description: text("description").notNull(),
  status: text("status").notNull().default("Laporan Awal"),
  eventDate: date("event_date", { mode: "string" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index("failure_cases_org_idx").on(table.organizationId), index("failure_cases_case_idx").on(table.caseId)]);

export const expertAssignmentsTable = pgTable("expert_assignments", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  failureCaseId: integer("failure_case_id").references(() => failureCasesTable.id, { onDelete: "cascade" }),
  contractCaseId: integer("contract_case_id"),
  expertName: text("expert_name").notNull(),
  expertContact: text("expert_contact"),
  role: text("role").notNull().default("Penilai Ahli"),
  scope: text("scope").notNull(),
  status: text("status").notNull().default("DRAFT"),
  scopeAcceptedAt: timestamp("scope_accepted_at", { withTimezone: true }),
  conflictStatus: text("conflict_status").notNull().default("PENDING"),
  conflictDeclaration: text("conflict_declaration"),
  conflictDeclaredAt: timestamp("conflict_declared_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index("expert_assignments_org_idx").on(table.organizationId), index("expert_assignments_failure_idx").on(table.failureCaseId)]);

export const mediationRoomsTable = pgTable("mediation_rooms", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  contractCaseId: integer("contract_case_id"),
  failureCaseId: integer("failure_case_id"),
  reference: text("reference").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("DRAFT"),
  agreementDraft: text("agreement_draft"),
  outcomeNotes: text("outcome_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index("mediation_rooms_org_idx").on(table.organizationId), index("mediation_rooms_case_idx").on(table.contractCaseId)]);

export const mediationParticipantsTable = pgTable("mediation_participants", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  roomId: integer("room_id").notNull().references(() => mediationRoomsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => appUsersTable.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  contact: text("contact"),
  role: text("role").notNull(),
  legacyAccessRole: text("access_role").notNull().default("PARTY"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("mediation_participants_room_idx").on(table.roomId),
  index("mediation_participants_user_idx").on(table.userId),
  uniqueIndex("mediation_participants_room_user_unique").on(table.roomId, table.userId),
]);

export const mediationSessionsTable = pgTable("mediation_sessions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  roomId: integer("room_id").notNull().references(() => mediationRoomsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  status: text("status").notNull().default("SCHEDULED"),
  agenda: text("agenda"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("mediation_sessions_room_idx").on(table.roomId)]);

export const mediationIssuesTable = pgTable("mediation_issues", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  roomId: integer("room_id").notNull().references(() => mediationRoomsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  claimantPosition: text("claimant_position"),
  respondentPosition: text("respondent_position"),
  resolution: text("resolution"),
  status: text("status").notNull().default("NEGOTIATING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index("mediation_issues_room_idx").on(table.roomId)]);

export const mediationEvidenceTable = pgTable("mediation_evidence", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  roomId: integer("room_id").notNull().references(() => mediationRoomsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  objectPath: text("object_path"),
  mimeType: text("mime_type"),
  confidentiality: text("confidentiality").notNull().default("ROOM"),
  allowedParticipantRoles: jsonb("allowed_roles").$type<string[]>().notNull().default([]),
  allowedParticipantIds: jsonb("allowed_participant_ids").$type<number[]>().notNull().default([]),
  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("mediation_evidence_room_idx").on(table.roomId)]);

export const collaborationActivitiesTable = pgTable("collaboration_activities", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  roomId: integer("room_id"),
  failureCaseId: integer("failure_case_id"),
  action: text("action").notNull(),
  detail: text("detail").notNull(),
  actor: text("actor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("collaboration_activities_org_idx").on(table.organizationId), index("collaboration_activities_room_idx").on(table.roomId)]);

export const insertFailureCaseSchema = createInsertSchema(failureCasesTable).omit({ id: true, organizationId: true, createdAt: true, updatedAt: true });
export type InsertFailureCase = z.infer<typeof insertFailureCaseSchema>;