import { relations } from "drizzle-orm";
import {
  date,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";


export const usersTable = pgTable(
  "users",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const sessionsTable = pgTable("sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const peopleTable = pgTable("people", {
  id: varchar("id", { length: 64 }).primaryKey(),
  ownerId: varchar("owner_id", { length: 64 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  company: text("company"),
  role: text("role"),
  location: text("location"),
  howMet: text("how_met"),
  dateMet: date("date_met", { mode: "string" }),
  notes: text("notes"),
  // What this person is actively after (hiring, fundraising, a mentor, ...).
  // Kept as its own field, not folded into notes, so the intro engine can
  // reason over goals directly.
  lookingFor: text("looking_for"),
  lastContacted: date("last_contacted", { mode: "string" }),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const interactionsTable = pgTable("interactions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  ownerId: varchar("owner_id", { length: 64 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  personId: varchar("person_id", { length: 64 })
    .notNull()
    .references(() => peopleTable.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  summary: text("summary").notNull(),
  rawNote: text("raw_note"),
});

export const connectionsTable = pgTable("connections", {
  id: varchar("id", { length: 64 }).primaryKey(),
  ownerId: varchar("owner_id", { length: 64 })
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  personAId: varchar("person_a_id", { length: 64 })
    .notNull()
    .references(() => peopleTable.id, { onDelete: "cascade" }),
  personBId: varchar("person_b_id", { length: 64 })
    .notNull()
    .references(() => peopleTable.id, { onDelete: "cascade" }),
  relationshipType: text("relationship_type").notNull(),
  notes: text("notes"),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  people: many(peopleTable),
  sessions: many(sessionsTable),
}));

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
  ownerId: true,
  createdAt: true,
});
export const insertInteractionSchema = createInsertSchema(interactionsTable).omit({ ownerId: true });
export const insertConnectionSchema = createInsertSchema(connectionsTable).omit({ ownerId: true });

export type Person = typeof peopleTable.$inferSelect;
export type Interaction = typeof interactionsTable.$inferSelect;
export type Connection = typeof connectionsTable.$inferSelect;
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
