import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { ImportContactsBody, ImportContactsResponse } from "@workspace/api-zod";
import { db, peopleTable } from "@workspace/db";
import { currentUser } from "../middleware/auth";
import { markIntrosStale } from "../lib/intros-service";
import { recordEvent } from "../lib/events";

const router: IRouter = Router();

// Bulk-add path shared by every import source (phone contacts now, a LinkedIn
// export later). Each source only has to map its rows to { name, email, phone,
// company } and post them here; dedupe and persistence live in one place.
router.post("/people/import", async (req, res): Promise<void> => {
  const ownerId = currentUser(res).id;
  const parsed = ImportContactsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Dedupe by case-insensitive name against everyone already in the network,
  // and against earlier rows in this same batch, so re-running an import or a
  // contact list with repeats never creates duplicate people.
  const existing = await db
    .select({ name: peopleTable.name })
    .from(peopleTable)
    .where(eq(peopleTable.ownerId, ownerId));
  const seen = new Set(existing.map((p) => p.name.trim().toLowerCase()));

  const rows: (typeof peopleTable.$inferInsert)[] = [];
  let skipped = 0;

  for (const contact of parsed.data.contacts) {
    const name = contact.name?.trim();
    const key = name?.toLowerCase();
    if (!name || !key || seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);

    // People have no phone/email columns, so keep those details in notes
    // rather than dropping them. Tag imports so they're easy to review later.
    const details = [
      contact.phone?.trim() ? `Phone: ${contact.phone.trim()}` : null,
      contact.email?.trim() ? `Email: ${contact.email.trim()}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    rows.push({
      id: randomUUID(),
      ownerId,
      name,
      company: contact.company?.trim() || null,
      role: contact.role?.trim() || null,
      howMet: "Imported from contacts",
      notes: details || null,
      tags: ["imported"],
      // Date met and last contacted are genuinely unknown for an import, so
      // leave them null rather than pretending you met them today.
      dateMet: null,
      lastContacted: null,
    });
  }

  const people = rows.length
    ? await db.insert(peopleTable).values(rows).returning()
    : [];

  if (people.length) {
    markIntrosStale(ownerId);
    void recordEvent(ownerId, "contacts_imported", { count: people.length });
  }
  res.status(201).json(
    ImportContactsResponse.parse({
      imported: people.length,
      skipped,
      people: people.map((person) => ({ ...person, tags: person.tags ?? [] })),
    }),
  );
});

export default router;

