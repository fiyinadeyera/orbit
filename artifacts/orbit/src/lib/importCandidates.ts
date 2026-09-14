// The normalized shape every import source (Google, LinkedIn, ...) maps into
// before the shared review-and-import step. `key` is what the review list
// dedupes on (the person's name today).
export type ImportCandidate = {
  key: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
};

/** Dedupe by key and sort by name, for a clean review list. */
export function dedupeAndSort(list: ImportCandidate[]): ImportCandidate[] {
  const byKey = new Map<string, ImportCandidate>();
  for (const candidate of list) {
    if (!byKey.has(candidate.key)) byKey.set(candidate.key, candidate);
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}
