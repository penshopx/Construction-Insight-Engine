import { bigint, integer, pgEnum, pgTable, serial, text, timestamp, type AnyPgColumn } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { appUsersTable, organizationsTable } from "./organizations";

export const referenceProcessingStatus = pgEnum("reference_processing_status", [
  "processing",
  "ready",
  "failed",
]);

export const referenceDocumentsTable = pgTable("reference_documents", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizationsTable.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  sourceFilename: text("source_filename").notNull(),
  sourceChecksum: text("source_checksum").notNull(),
  fileType: text("file_type").notNull(),
  objectPath: text("object_path"),
  replacesDocumentId: integer("replaces_document_id")
    .references((): AnyPgColumn => referenceDocumentsTable.id, { onDelete: "set null" }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  processingStatus: referenceProcessingStatus("processing_status").notNull().default("ready"),
  processingError: text("processing_error"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const referenceUploadsTable = pgTable("reference_uploads", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizationsTable.id, { onDelete: "cascade" }),
  uploadedByUserId: integer("uploaded_by_user_id")
    .notNull()
    .references(() => appUsersTable.id, { onDelete: "cascade" }),
  objectPath: text("object_path").notNull().unique(),
  sourceFilename: text("source_filename").notNull(),
  expectedSize: bigint("expected_size", { mode: "number" }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
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
  updatedAt: true,
});
export const insertReferenceSectionSchema = createInsertSchema(referenceSectionsTable).omit({ id: true });

export type ReferenceDocument = typeof referenceDocumentsTable.$inferSelect;
export type ReferenceSection = typeof referenceSectionsTable.$inferSelect;
export type InsertReferenceDocument = z.infer<typeof insertReferenceDocumentSchema>;
export type InsertReferenceSection = z.infer<typeof insertReferenceSectionSchema>;