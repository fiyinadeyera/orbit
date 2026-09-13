import { eq } from "drizzle-orm";
import { connectionsTable, db, peopleTable } from "@workspace/db";
import { suggestIntros, type IntroSuggestion } from "@workspace/intro-engine";
import { completeClaude } from "./claude";
import { connectionToExisting, personToContact } from "./intro-mapping";

// Intros are the slow page: generating them runs the LLM over the whole network,
// which took ~a minute cold. So we cache the last computed set per owner and
// serve it instantly, refreshing in the background rather than on the request.
type Entry = {
  suggestions: IntroSuggestion[];
  computedAt: number;
  refreshing: boolean;
};

const cache = new Map<string, Entry>();

// How long a cached set is considered fresh. After this, the next read serves
// the stale set immediately and kicks off one background refresh.
const TTL_MS = 15 * 60 * 1000;

async function compute(ownerId: string): Promise<IntroSuggestion[]> {
  const [people, connections] = await Promise.all([
    db.select().from(peopleTable).where(eq(peopleTable.ownerId, ownerId)).orderBy(peopleTable.name),
    db.select().from(connectionsTable).where(eq(connectionsTable.ownerId, ownerId)),
  ]);

  return suggestIntros(
    people.map(personToContact),
    connections.map(connectionToExisting),
    completeClaude,
  );
}

function refreshInBackground(ownerId: string, entry: Entry): void {
  entry.refreshing = true;
  compute(ownerId)
    .then((suggestions) =>
      cache.set(ownerId, { suggestions, computedAt: Date.now(), refreshing: false }),
    )
    .catch(() => {
      // Best-effort: keep serving the stale set and let the next read retry.
      const current = cache.get(ownerId);
      if (current) current.refreshing = false;
    });
}

/**
 * Serve an owner's intros. Instant when cached: a fresh set is returned as-is, a
 * stale one is returned immediately while a single background refresh runs. Only
 * the very first read (cold cache) waits on the LLM.
 */
export async function getIntros(ownerId: string): Promise<IntroSuggestion[]> {
  const entry = cache.get(ownerId);

  if (entry) {
    const stale = Date.now() - entry.computedAt > TTL_MS;
    if (stale && !entry.refreshing) refreshInBackground(ownerId, entry);
    return entry.suggestions;
  }

  const suggestions = await compute(ownerId);
  cache.set(ownerId, { suggestions, computedAt: Date.now(), refreshing: false });
  return suggestions;
}

/**
 * Mark an owner's intros stale after their network changes, so the next read
 * serves the current set instantly and refreshes once in the background. Cheap:
 * it never calls the LLM on the write path.
 */
export function markIntrosStale(ownerId: string): void {
  const entry = cache.get(ownerId);
  if (entry) entry.computedAt = 0;
}
