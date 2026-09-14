import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { connectionsTable, db, interactionsTable, peopleTable } from "@workspace/db";

// A small, curated demo network. The "looking for" fields deliberately
// complement each other (an investor and a founder raising; a hiring manager
// and a job-seeker) so intros and the ask box have something to find. Clearly
// fictional sample data, tagged "demo".

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

type SeedPerson = {
  key: string;
  name: string;
  company: string;
  role: string;
  location: string;
  notes: string;
  lookingFor: string;
  tags: string[];
  lastDays: number;
};

const PEOPLE: SeedPerson[] = [
  {
    key: "ada",
    name: "Ada Okafor",
    company: "Figma",
    role: "Senior Product Designer",
    location: "San Francisco",
    notes: "Met at Config. Deep on design systems and accessibility.",
    lookingFor: "advising early-stage startups on design",
    tags: ["demo", "design"],
    lastDays: 45,
  },
  {
    key: "marcus",
    name: "Marcus Bell",
    company: "Ledgerly",
    role: "Founder & CEO",
    location: "New York",
    notes: "Building B2B payments. Raising a seed round.",
    lookingFor: "a lead designer and seed investors",
    tags: ["demo", "founder", "fintech"],
    lastDays: 10,
  },
  {
    key: "priya",
    name: "Priya Nair",
    company: "Northwind Ventures",
    role: "Partner",
    location: "New York",
    notes: "Invests in seed-stage fintech and dev tools.",
    lookingFor: "founders raising a seed round",
    tags: ["demo", "investor", "fintech"],
    lastDays: 20,
  },
  {
    key: "daniel",
    name: "Daniel Weiss",
    company: "Stripe",
    role: "Engineering Manager",
    location: "Remote",
    notes: "Runs a payments team. Hiring senior backend engineers.",
    lookingFor: "senior backend engineers",
    tags: ["demo", "engineering", "hiring"],
    lastDays: 60,
  },
  {
    key: "sofia",
    name: "Sofia Mendes",
    company: "Freelance",
    role: "Backend Engineer",
    location: "Lisbon",
    notes: "Ex-Stripe. Open to a new senior role.",
    lookingFor: "a senior backend engineering role",
    tags: ["demo", "engineering"],
    lastDays: 5,
  },
  {
    key: "tom",
    name: "Tom Hughes",
    company: "The Ledger",
    role: "Journalist",
    location: "London",
    notes: "Writes about fintech and startups. Always after a good story.",
    lookingFor: "interesting fintech founders to profile",
    tags: ["demo", "media", "fintech"],
    lastDays: 90,
  },
];

// Existing links only. The complementary pairs (Marcus/Priya, Daniel/Sofia) are
// left unconnected so the intro engine suggests them.
const CONNECTIONS: [string, string, string][] = [
  ["ada", "daniel", "Worked together"],
  ["marcus", "tom", "Interviewed by"],
];

const INTERACTIONS: { key: string; days: number; summary: string }[] = [
  { key: "ada", days: 45, summary: "Coffee. She wants to start advising startups on design." },
  { key: "marcus", days: 10, summary: "Call. The seed round is coming together, still needs a designer." },
];

/** Replace the user's network with the demo set. Returns how many people were seeded. */
export async function resetDemoData(userId: string): Promise<{ people: number }> {
  // Wipe the user's network; interactions and connections cascade off people.
  await db.delete(peopleTable).where(eq(peopleTable.ownerId, userId));

  const idByKey = new Map<string, string>();
  const peopleRows = PEOPLE.map((p) => {
    const id = randomUUID();
    idByKey.set(p.key, id);
    return {
      id,
      ownerId: userId,
      name: p.name,
      company: p.company,
      role: p.role,
      location: p.location,
      howMet: "Demo data",
      dateMet: daysAgo(p.lastDays + 30),
      notes: p.notes,
      lookingFor: p.lookingFor,
      lastContacted: daysAgo(p.lastDays),
      tags: p.tags,
    };
  });
  await db.insert(peopleTable).values(peopleRows);

  const connRows = CONNECTIONS.map(([a, b, type]) => ({
    id: randomUUID(),
    ownerId: userId,
    personAId: idByKey.get(a)!,
    personBId: idByKey.get(b)!,
    relationshipType: type,
    notes: null,
  }));
  if (connRows.length) await db.insert(connectionsTable).values(connRows);

  const interRows = INTERACTIONS.map((i) => ({
    id: randomUUID(),
    ownerId: userId,
    personId: idByKey.get(i.key)!,
    date: daysAgo(i.days),
    summary: i.summary,
    rawNote: null,
  }));
  if (interRows.length) await db.insert(interactionsTable).values(interRows);

  return { people: peopleRows.length };
}
