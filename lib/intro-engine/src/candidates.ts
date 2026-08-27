import type { Contact, ExistingConnection } from "./types";

/** Order-independent key for a pair of contact ids. */
export function pairKey(aId: string, bId: string): string {
  return aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`;
}

/** Build a set of already-connected pairs for O(1) lookups. */
export function buildConnectionSet(
  connections: ExistingConnection[],
): Set<string> {
  const set = new Set<string>();
  for (const { aId, bId } of connections) {
    if (aId && bId && aId !== bId) set.add(pairKey(aId, bId));
  }
  return set;
}

export function isAlreadyConnected(
  connected: Set<string>,
  aId: string,
  bId: string,
): boolean {
  return connected.has(pairKey(aId, bId));
}

/**
 * The pool of contacts the LLM is allowed to reason over. Trimmed to
 * `maxRosterSize`, most-recently-contacted first, so a large network still
 * fits a single prompt and the freshest relationships are never dropped.
 */
export function selectRoster(
  contacts: Contact[],
  maxRosterSize: number,
): Contact[] {
  if (contacts.length <= maxRosterSize) return contacts;
  const recencyRank = (c: Contact) =>
    c.lastContactedDaysAgo == null ? Number.POSITIVE_INFINITY : c.lastContactedDaysAgo;
  return [...contacts]
    .sort((a, b) => recencyRank(a) - recencyRank(b))
    .slice(0, maxRosterSize);
}
