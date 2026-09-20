import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workItemsTable = pgTable("work_items", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").notNull().default(0),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  project: text("project"),
  owner: text("owner"),
  status: text("status").notNull().default("Perlu ditinjau"),
  due: text("due"),
  kind: text("kind").notNull(),
  competencyArea: text("competency_area"),
  caseId: integer("case_id"),
  completed: boolean("completed").notNull().default(false),
  reminderDays: integer("reminder_days").array().notNull().default([]),
  reminderSentDays: integer("reminder_sent_days").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("work_items_organization_id_idx").on(table.organizationId),
]);

export const insertWorkItemSchema = createInsertSchema(workItemsTable).omit({
  id: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkItem = z.infer<typeof insertWorkItemSchema>;
export type WorkItem = typeof workItemsTable.$inferSelect;