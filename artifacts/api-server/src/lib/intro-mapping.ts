import type { Contact, ExistingConnection } from "@workspace/intro-engine";
import type { Connection, Person } from "@workspace/db";

function daysSince(date: string | null): number | null {
  if (!date) return null;
  return Math.floor(
    (Date.now() - new Date(`${date}T12:00:00Z`).getTime()) / 86_400_000,
  );
}

/**
 * Map an Orbit person into the engine's source-agnostic `Contact`. "Looking
 * for" isn't its own column in Orbit — capture folds it into `notes` — so we
 * leave `lookingFor` null and let the engine read goals out of `notes`.
 */
export function personToContact(person: Person): Contact {
  return {
    id: person.id,
    name: person.name,
    role: person.role,
    company: person.company,
    location: person.location,
    interests: person.tags ?? [],
    lookingFor: null,
    notes: person.notes,
    lastContactedDaysAgo: daysSince(person.lastContacted),
  };
}

export function connectionToExisting(connection: Connection): ExistingConnection {
  return { aId: connection.personAId, bId: connection.personBId };
}
