// The intro engine is deliberately source-agnostic: it knows nothing about
// Orbit, HTTP, databases, or which LLM scores the matches. A `Contact` is the
// normalized shape any data source (Orbit notes today; email/Slack/LinkedIn
// later) maps into before the engine reasons over it.

export type Contact = {
  id: string;
  name: string;
  role?: string | null;
  company?: string | null;
  location?: string | null;
  /** Interests / tags. */
  interests?: string[];
  /**
   * What this person is actively after — hiring, fundraising, looking for a
   * mentor, etc. Sources that don't isolate this can leave it null and lean on
   * `notes` instead; the engine reads both.
   */
  lookingFor?: string | null;
  /** Free-text context about the person (how you met, what they care about). */
  notes?: string | null;
  /** Days since you last spoke, if known. Recency feeds the scoring. */
  lastContactedDaysAgo?: number | null;
};

/** An introduction that already exists — the engine will not re-suggest it. */
export type ExistingConnection = {
  aId: string;
  bId: string;
};

/** One side of a suggested introduction, hydrated for display. */
export type IntroParty = {
  id: string;
  name: string;
  role?: string | null;
  company?: string | null;
};

export type IntroSuggestion = {
  personA: IntroParty;
  personB: IntroParty;
  /** Likely-mutual-value, 0–100. Higher means a stronger both-sides win. */
  score: number;
  /** Why this intro is worth making, and why now. */
  rationale: string;
  /** A short intro message the user could send as-is or lightly edit. */
  draftIntro: string;
};

/**
 * The engine's only outside dependency: a function that runs a prompt through
 * an LLM and returns its text. Injected by the caller so the engine carries no
 * API keys, no `fetch`, and no model choice of its own.
 */
export type CompleteFn = (
  prompt: string,
  options?: { maxTokens?: number },
) => Promise<string>;

export type SuggestIntrosOptions = {
  /** Maximum suggestions to return. Defaults to 5. */
  limit?: number;
  /** Maximum contacts to include in the roster sent to the LLM. Defaults to 150. */
  maxRosterSize?: number;
};
