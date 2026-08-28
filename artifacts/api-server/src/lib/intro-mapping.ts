import type { Contact, ExistingConnection } from "@workspace/intro-engine";
import type { Connection, Person } from "@workspace/db";

function daysSince(date: string | null): number | null {
  if (!date) return null;
  return Math.floor(
    (Date.now() - new Date(`${date}T12:00:00Z`).getTime()) / 86_400_000,
  );
}

/** Map an Orbit person into the engine's source-agnostic `Contact`. */
export function personToContact(person: Person): Contact {
  return {
    id: person.id,
    name: person.name,
    role: person.role,
    company: person.company,
    location: person.location,
    interests: person.tags ?? [],
    lookingFor: person.lookingFor,
    notes: person.notes,
    lastContactedDaysAgo: daysSince(person.lastContacted),
  };
}

export function connectionToExisting(connection: Connection): ExistingConnection {
  return { aId: connection.personAId, bId: connection.personBId };
}
