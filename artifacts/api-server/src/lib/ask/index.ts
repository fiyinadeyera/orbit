import { selectRoster, type Contact } from "@workspace/intro-engine";
import type { CompleteFn } from "@workspace/intro-engine";
import { buildAskPrompt } from "./prompt";
import { parseAskAnswer } from "./parse";
import type { AskAnswer, AskNetworkOptions } from "./types";

export type { AskAnswer, AskMatch, AskNetworkOptions } from "./types";

const DEFAULT_MAX_ROSTER = 200;

/**
 * Answer a natural-language question about the user's network. Pure apart from
 * the injected `complete`: it builds a roster, asks the LLM, and returns a
 * grounded answer plus the people it refers to. The same shape as the intro
 * engine, so it consumes Orbit contacts today and any other corpus tomorrow.
 */
export async function askNetwork(
  question: string,
  contacts: Contact[],
  complete: CompleteFn,
  options: AskNetworkOptions = {},
): Promise<AskAnswer> {
  const trimmed = question.trim();
  if (!trimmed) {
    return { answer: "Ask a question about your network.", matches: [] };
  }
  if (contacts.length === 0) {
    return {
      answer: "Your network is empty. Add a few people, then ask again.",
      matches: [],
    };
  }

  const roster = selectRoster(contacts, options.maxRosterSize ?? DEFAULT_MAX_ROSTER);
  const prompt = buildAskPrompt(roster, trimmed);
  const raw = await complete(prompt, { maxTokens: 1500 });

  return parseAskAnswer(raw, roster);
}
