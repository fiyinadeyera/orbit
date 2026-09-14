// Read-only access to the user's Google contacts on the web. A one-time data
// grant, not a login: Orbit uses the token to fetch contacts once via the
// People API, then drops it. (Signing in with Google as an Orbit identity is a
// separate concern.) Mirrors the mobile mapper so both platforms normalise
// Google people the same way.

import type { ImportCandidate } from './importCandidates';

export const GOOGLE_CONTACTS_SCOPE = 'https://www.googleapis.com/auth/contacts.readonly';

// The Web OAuth client id from the Google Cloud Console, injected at build time
// as a Vite env var. Undefined until the owner sets it (see GOOGLE_SETUP.md);
// the import UI shows a "not configured yet" state in that case.
export function getGoogleClientId(): string | undefined {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  return env.VITE_GOOGLE_CLIENT_ID || undefined;
}

// Minimal shape of a Google People API "person" (only the fields we request).
type GooglePerson = {
  names?: { displayName?: string }[];
  emailAddresses?: { value?: string }[];
  phoneNumbers?: { value?: string }[];
  organizations?: { name?: string; title?: string }[];
};

/** Pure mapper: a Google person to an import candidate, or null if unnamed. */
export function mapGooglePerson(person: GooglePerson): ImportCandidate | null {
  const name = person.names?.[0]?.displayName?.trim();
  if (!name) return null;
  return {
    key: name,
    name,
    email: person.emailAddresses?.[0]?.value?.trim() || undefined,
    phone: person.phoneNumbers?.[0]?.value?.trim() || undefined,
    company: person.organizations?.[0]?.name?.trim() || undefined,
    role: person.organizations?.[0]?.title?.trim() || undefined,
  };
}

/**
 * Fetch the user's Google contacts with an access token and map them to import
 * candidates. Pages through the People API so large address books come back in
 * full. Deduping happens later in the shared import endpoint.
 */
export async function fetchGoogleContacts(accessToken: string): Promise<ImportCandidate[]> {
  const personFields = 'names,emailAddresses,phoneNumbers,organizations';
  const candidates: ImportCandidate[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL('https://people.googleapis.com/v1/people/me/connections');
    url.searchParams.set('personFields', personFields);
    url.searchParams.set('pageSize', '1000');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      throw new Error(`Google contacts request failed (${response.status}).`);
    }

    const data = (await response.json()) as {
      connections?: GooglePerson[];
      nextPageToken?: string;
    };

    for (const person of data.connections ?? []) {
      const candidate = mapGooglePerson(person);
      if (candidate) candidates.push(candidate);
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return candidates;
}
