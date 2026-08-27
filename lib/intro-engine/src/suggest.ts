import { selectRoster } from "./candidates";
import { parseIntroSuggestions } from "./parse";
import { buildIntroPrompt } from "./prompt";
import type {
  CompleteFn,
  Contact,
  ExistingConnection,
  IntroSuggestion,
  SuggestIntrosOptions,
} from "./types";

const DEFAULT_LIMIT = 5;
const DEFAULT_MAX_ROSTER = 150;

/**
 * The engine's one public entry point: given a network and a way to call an
 * LLM, return the introductions most worth making, ranked by likely mutual
 * value. Pure apart from the injected `complete` — feed it Orbit contacts
 * today, any other corpus tomorrow.
 */
export async function suggestIntros(
  contacts: Contact[],
  connections: ExistingConnection[],
  complete: CompleteFn,
  options: SuggestIntrosOptions = {},
): Promise<IntroSuggestion[]> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const maxRosterSize = options.maxRosterSize ?? DEFAULT_MAX_ROSTER;

  // Fewer than two people means there is nobody to introduce — skip the LLM.
  if (contacts.length < 2) return [];

  const roster = selectRoster(contacts, maxRosterSize);
  const prompt = buildIntroPrompt(roster, connections, limit);
  const raw = await complete(prompt, { maxTokens: 4096 });

  return parseIntroSuggestions(raw, roster, connections, limit);
}
