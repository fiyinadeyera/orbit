import { randomUUID } from "node:crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CaptureNoteBody,
  CaptureNoteResponse,
  CreateInteractionBody,
  CreateInteractionParams,
  CreateInteractionResponse,
  CreatePersonBody,
  CreatePersonResponse,
  DeletePersonParams,
  GetGraphResponse,
  GetPersonParams,
  GetPersonResponse,
  ListPeopleQueryParams,
  ListPeopleResponse,
  ListReconnectsResponse,
  UpdatePersonBody,
  UpdatePersonParams,
  UpdatePersonResponse,
} from "@workspace/api-zod";
import {
  connectionsTable,
  db,
  interactionsTable,
  peopleTable,
  type Person,
} from "@workspace/db";
import { extractRelationship } from "../lib/relationship-extraction";
import { reverseGeocode } from "../lib/geocoding";

const router: IRouter = Router();

const isoDate = (value: Date) => value.toISOString().slice(0, 10);
const dayDifference = (date: string) =>
  Math.floor((Date.now() - new Date(`${date}T12:00:00Z`).getTime()) / 86_400_000);

function personResponse(person: Person) {
  return {
    ...person,
    tags: person.tags ?? [],
  };
}

function personValues(
  input: {
    name?: string;
    company?: string;
    role?: string;
    location?: string;
    howMet?: string;
    dateMet?: Date;
    notes?: string;
    tags?: string[];
  },
) {
  return {
    ...input,
    dateMet: input.dateMet ? isoDate(input.dateMet) : undefined,
  };
}

router.get("/people", async (req, res): Promise<void> => {
  const parsed = ListPeopleQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const people = await db.select().from(peopleTable).orderBy(desc(peopleTable.createdAt));
  const search = parsed.data.search?.trim().toLowerCase();
  const filtered = search
    ? people.filter((person) =>
        [person.name, person.company, person.role, person.notes, ...(person.tags ?? [])]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(search)),
      )
    : people;

  res.json(ListPeopleResponse.parse(filtered.map(personResponse)));
});

router.post("/people", async (req, res): Promise<void> => {
  const parsed = CreatePersonBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const values = personValues(parsed.data);
  // If the user didn't pick a date, assume "today" — the day the entry was
  // made is the most reasonable default for when they met this person.
  const dateMet = values.dateMet ?? isoDate(new Date());
  const [person] = await db
    .insert(peopleTable)
    .values({
      id: randomUUID(),
      name: values.name!,
      company: values.company,
      role: values.role,
      location: values.location,
      howMet: values.howMet,
      dateMet,
      notes: values.notes,
      tags: values.tags ?? [],
      lastContacted: dateMet,
    })
    .returning();

  res.status(201).json(CreatePersonResponse.parse(personResponse(person)));
});

router.get("/people/:id", async (req, res): Promise<void> => {
  const params = GetPersonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [person] = await db
    .select()
    .from(peopleTable)
    .where(eq(peopleTable.id, params.data.id));
  if (!person) {
    res.status(404).json({ error: "Person not found." });
    return;
  }

  const [interactions, connections] = await Promise.all([
    db
      .select()
      .from(interactionsTable)
      .where(eq(interactionsTable.personId, person.id))
      .orderBy(desc(interactionsTable.date)),
    db
      .select()
      .from(connectionsTable)
      .where(
        or(
          eq(connectionsTable.personAId, person.id),
          eq(connectionsTable.personBId, person.id),
        ),
      ),
  ]);

  res.json(
    GetPersonResponse.parse({
      ...personResponse(person),
      interactions,
      connections,
    }),
  );
});

router.patch("/people/:id", async (req, res): Promise<void> => {
  const params = UpdatePersonParams.safeParse(req.params);
  const body = UpdatePersonBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const values = personValues(body.data);
  const [person] = await db
    .update(peopleTable)
    .set(values)
    .where(eq(peopleTable.id, params.data.id))
    .returning();
  if (!person) {
    res.status(404).json({ error: "Person not found." });
    return;
  }

  res.json(UpdatePersonResponse.parse(personResponse(person)));
});

router.delete("/people/:id", async (req, res): Promise<void> => {
  const params = DeletePersonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [person] = await db
    .delete(peopleTable)
    .where(eq(peopleTable.id, params.data.id))
    .returning();
  if (!person) {
    res.status(404).json({ error: "Person not found." });
    return;
  }

  res.sendStatus(204);
});

router.post("/people/:id/interactions", async (req, res): Promise<void> => {
  const params = CreateInteractionParams.safeParse(req.params);
  const body = CreateInteractionBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [person] = await db
    .select({ id: peopleTable.id })
    .from(peopleTable)
    .where(eq(peopleTable.id, params.data.id));
  if (!person) {
    res.status(404).json({ error: "Person not found." });
    return;
  }

  const [interaction] = await db
    .insert(interactionsTable)
    .values({
      id: randomUUID(),
      personId: person.id,
      date: isoDate(body.data.date),
      summary: body.data.summary,
      rawNote: body.data.rawNote,
    })
    .returning();
  await db
    .update(peopleTable)
    .set({ lastContacted: interaction.date })
    .where(eq(peopleTable.id, person.id));

  res.status(201).json(CreateInteractionResponse.parse(interaction));
});

router.post("/capture", async (req, res): Promise<void> => {
  const body = CaptureNoteBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  try {
    const extracted = await extractRelationship(body.data.note);
    const [existing] = await db
      .select()
      .from(peopleTable)
      .where(eq(peopleTable.name, extracted.name));
    const notes = [extracted.status, extracted.context].filter(Boolean).join(" — ") || null;

    // Prefer a location mentioned in the note itself. If none was mentioned,
    // fall back to reverse-geocoding the device coordinates captured at
    // entry time (when the browser provided them), so we still get a useful
    // location without asking the user to type one in.
    let location = extracted.location;
    if (!location && body.data.latitude != null && body.data.longitude != null) {
      location = await reverseGeocode(body.data.latitude, body.data.longitude);
    }
    // Never erase a location we already know for this person just because a
    // later note happened not to mention or infer one.
    if (!location && existing?.location) {
      location = existing.location;
    }

    const values = {
      company: extracted.company,
      role: extracted.role,
      location,
      howMet: extracted.context,
      notes,
      tags: extracted.interests,
      lastContacted: extracted.date,
    };

    // "Date met" is recorded once, as the day this first entry was made —
    // not re-derived from note text, and never overwritten on later notes
    // about the same person.
    const person = existing
      ? (
          await db
            .update(peopleTable)
            .set(values)
            .where(eq(peopleTable.id, existing.id))
            .returning()
        )[0]
      : (
          await db
            .insert(peopleTable)
            .values({
              id: randomUUID(),
              name: extracted.name,
              ...values,
              dateMet: isoDate(new Date()),
            })
            .returning()
        )[0];

    await db.insert(interactionsTable).values({
      id: randomUUID(),
      personId: person.id,
      date: extracted.date,
      summary: extracted.context ?? "Captured a new relationship note.",
      rawNote: body.data.note,
    });

    if (extracted.connectedTo.length) {
      const mentionedPeople = await db.select().from(peopleTable);
      const matches = mentionedPeople.filter(
        (candidate) =>
          candidate.id !== person.id &&
          extracted.connectedTo.some(
            (name) => name.toLowerCase() === candidate.name.toLowerCase(),
          ),
      );
      for (const match of matches) {
        const [alreadyConnected] = await db
          .select({ id: connectionsTable.id })
          .from(connectionsTable)
          .where(
            or(
              and(
                eq(connectionsTable.personAId, person.id),
                eq(connectionsTable.personBId, match.id),
              ),
              and(
                eq(connectionsTable.personAId, match.id),
                eq(connectionsTable.personBId, person.id),
              ),
            ),
          );
        if (!alreadyConnected) {
          await db.insert(connectionsTable).values({
            id: randomUUID(),
            personAId: person.id,
            personBId: match.id,
            relationshipType: "Mentioned connection",
            notes: null,
          });
        }
      }
    }

    res.status(201).json(
      CaptureNoteResponse.parse({
        person: personResponse(person),
        extracted,
        created: !existing,
      }),
    );
  } catch (error) {
    req.log.warn({ error }, "Relationship extraction failed");
    res.status(502).json({
      error: error instanceof Error ? error.message : "Could not extract the relationship note.",
    });
  }
});

router.get("/reconnects", async (_req, res): Promise<void> => {
  const people = await db.select().from(peopleTable).orderBy(peopleTable.name);
  const prompts = await Promise.all(
    people
      .map((person) => ({
        person,
        daysSinceContact: dayDifference(person.lastContacted ?? isoDate(person.createdAt)),
      }))
      .filter(({ daysSinceContact }) => daysSinceContact >= 30)
      .map(async ({ person, daysSinceContact }) => {
        const [lastInteraction] = await db
          .select({ summary: interactionsTable.summary })
          .from(interactionsTable)
          .where(eq(interactionsTable.personId, person.id))
          .orderBy(desc(interactionsTable.date))
          .limit(1);
        return {
          person: personResponse(person),
          daysSinceContact,
          lastInteraction: lastInteraction?.summary ?? null,
        };
      }),
  );

  res.json(ListReconnectsResponse.parse(prompts));
});

router.get("/graph", async (_req, res): Promise<void> => {
  const [people, connections] = await Promise.all([
    db.select().from(peopleTable).orderBy(peopleTable.name),
    db.select().from(connectionsTable),
  ]);
  const initials = (name: string) =>
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();

  res.json(
    GetGraphResponse.parse({
      nodes: people.map((person) => ({
        id: person.id,
        name: person.name,
        company: person.company,
        initials: initials(person.name),
        tags: person.tags ?? [],
      })),
      edges: connections,
    }),
  );
});

export default router;