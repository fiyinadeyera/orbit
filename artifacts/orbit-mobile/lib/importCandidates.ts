// Shared shape for a person coming from any import source (phone contacts,
// Google contacts, a LinkedIn export later). Each source maps its rows to this,
// then hands them to the shared review screen, which posts them to
// /api/people/import.

export type ImportCandidate = {
  /** Stable, unique key for lists. Callers guarantee uniqueness after dedupe. */
  key: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
};

/**
 * Drop rows with no name, collapse same-name duplicates within the batch, and
 * split out the ones already in Orbit (matched case-insensitively by name).
 * Pure so it can be reasoned about and tested without a device.
 */
export function dedupeCandidates(
  candidates: ImportCandidate[],
  existingNames: Set<string>,
): { fresh: ImportCandidate[]; alreadyCount: number } {
  const seen = new Set<string>();
  const fresh: ImportCandidate[] = [];
  let alreadyCount = 0;

  for (const candidate of candidates) {
    const nameKey = candidate.name.trim().toLowerCase();
    if (!nameKey || seen.has(nameKey)) continue;
    seen.add(nameKey);
    if (existingNames.has(nameKey)) {
      alreadyCount += 1;
      continue;
    }
    fresh.push(candidate);
  }

  return { fresh, alreadyCount };
}
