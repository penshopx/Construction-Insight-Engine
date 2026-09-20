import { date, index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contractCasesTable = pgTable("contract_cases", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  reference: text("reference").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  project: text("project").notNull(),
  eventDate: date("event_date", { mode: "string" }).notNull(),
  noticeDueDate: date("notice_due_date", { mode: "string" }),
  noticeReference: text("notice_reference"),
  clauseBasis: text("clause_basis").notNull(),
  description: text("description").notNull(),
  impactValue: text("impact_value"),
  currentStage: integer("current_stage").notNull().default(0),
  status: text("status").notNull().default("Draft"),
  owner: text("owner"),
  typeDetails: jsonb("type_details").$type<Record<string, string>>().notNull().default({}),
  evidence: jsonb("evidence").$type<Array<{ name: string; note?: string }>>().notNull().default([]),
  customChecklistValues: jsonb("custom_checklist_values").$type<Record<string, string>>().notNull().default({}),
  reviewNotes: text("review_notes"),
  decisionOutcome: text("decision_outcome"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("contract_cases_organization_id_idx").on(table.organizationId),
]);

export const contractCaseChecklistRequirementsTable = pgTable("contract_case_checklist_requirements", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull(),
  caseType: text("case_type").notNull(),
  stage: integer("stage").notNull(),
  label: text("label").notNull(),
  instructions: text("instructions").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("contract_case_checklist_requirements_org_idx").on(table.organizationId),
  index("contract_case_checklist_requirements_lookup_idx").on(table.organizationId, table.caseType, table.stage),
]);

export const contractCaseActivitiesTable = pgTable("contract_case_activities", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull().references(() => contractCasesTable.id, { onDelete: "cascade" }),
  organizationId: integer("organization_id").notNull(),
  action: text("action").notNull(),
  detail: text("detail").notNull(),
  actor: text("actor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("contract_case_activities_case_id_idx").on(table.caseId),
  index("contract_case_activities_organization_id_idx").on(table.organizationId),
]);

export const insertContractCaseSchema = createInsertSchema(contractCasesTable).omit({
  id: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertContractCase = z.infer<typeof insertContractCaseSchema>;
export type ContractCase = typeof contractCasesTable.$inferSelect;
export type ContractCaseChecklistRequirement = typeof contractCaseChecklistRequirementsTable.$inferSelect;