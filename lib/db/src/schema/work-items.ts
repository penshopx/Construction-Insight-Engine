import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workItemsTable = pgTable("work_items", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  project: text("project"),
  owner: text("owner"),
  status: text("status").notNull().default("Perlu ditinjau"),
  due: text("due"),
  kind: text("kind").notNull(),
  competencyArea: text("competency_area"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertWorkItemSchema = createInsertSchema(workItemsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkItem = z.infer<typeof insertWorkItemSchema>;
export type WorkItem = typeof workItemsTable.$inferSelect;