import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const referenceDocumentsTable = pgTable("reference_documents", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  sourceFilename: text("source_filename").notNull(),
  sourceChecksum: text("source_checksum").notNull(),
  fileType: text("file_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const referenceSectionsTable = pgTable("reference_sections", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id")
    .notNull()
    .references(() => referenceDocumentsTable.id, { onDelete: "cascade" }),
  sectionNumber: integer("section_number").notNull(),
  heading: text("heading"),
  content: text("content").notNull(),
  topics: text("topics").array().notNull().default([]),
});

export const insertReferenceDocumentSchema = createInsertSchema(referenceDocumentsTable).omit({
  id: true,
  createdAt: true,
});
export const insertReferenceSectionSchema = createInsertSchema(referenceSectionsTable).omit({ id: true });

export type ReferenceDocument = typeof referenceDocumentsTable.$inferSelect;
export type ReferenceSection = typeof referenceSectionsTable.$inferSelect;
export type InsertReferenceDocument = z.infer<typeof insertReferenceDocumentSchema>;
export type InsertReferenceSection = z.infer<typeof insertReferenceSectionSchema>;