import { relations } from "drizzle-orm";
import {
  date,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const peopleTable = pgTable("people", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  company: text("company"),
  role: text("role"),
  location: text("location"),
  howMet: text("how_met"),
  dateMet: date("date_met", { mode: "string" }),
  notes: text("notes"),
  lastContacted: date("last_contacted", { mode: "string" }),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const interactionsTable = pgTable("interactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  personId: varchar("person_id", { length: 64 })
    .notNull()
    .references(() => peopleTable.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  summary: text("summary").notNull(),
  rawNote: text("raw_note"),
});

export const connectionsTable = pgTable("connections", {
  id: varchar("id", { length: 64 }).primaryKey(),
  personAId: varchar("person_a_id", { length: 64 })
    .notNull()
    .references(() => peopleTable.id, { onDelete: "cascade" }),
  personBId: varchar("person_b_id", { length: 64 })
    .notNull()
    .references(() => peopleTable.id, { onDelete: "cascade" }),
  relationshipType: text("relationship_type").notNull(),
  notes: text("notes"),
});

export const peopleRelations = relations(peopleTable, ({ many }) => ({
  interactions: many(interactionsTable),
}));

export const interactionsRelations = relations(interactionsTable, ({ one }) => ({
  person: one(peopleTable, {
    fields: [interactionsTable.personId],
    references: [peopleTable.id],
  }),
}));

export const insertPersonSchema = createInsertSchema(peopleTable).omit({
  createdAt: true,
});
export const insertInteractionSchema = createInsertSchema(interactionsTable);
export const insertConnectionSchema = createInsertSchema(connectionsTable);

export type Person = typeof peopleTable.$inferSelect;
export type Interaction = typeof interactionsTable.$inferSelect;
export type Connection = typeof connectionsTable.$inferSelect;
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;