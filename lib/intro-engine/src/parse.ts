import {
  buildConnectionSet,
  isAlreadyConnected,
  pairKey,
} from "./candidates";
import type {
  Contact,
  ExistingConnection,
  IntroParty,
  IntroSuggestion,
} from "./types";

/** Pull the first complete JSON object or array out of model prose. */
function extractJson(value: string): string | null {
  const text = value
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .trim();

  for (let start = 0; start < text.length; start += 1) {
    const opener = text[start];
    if (opener !== "{" && opener !== "[") continue;

    const stack: string[] = [];
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i += 1) {
      const char = text[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === '"') inString = false;
        continue;
      }

      if (char === '"') {
        inString = true;
      } else if (char === "{" || char === "[") {
        stack.push(char);
      } else if (char === "}" || char === "]") {
        const expected = char === "}" ? "{" : "[";
        if (stack.pop() !== expected) break;
        if (stack.length === 0) return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function parseModelJson(raw: string): unknown {
  const candidate = extractJson(raw);
  if (!candidate) throw new Error("The intro engine returned an unparseable response.");

  try {
    return JSON.parse(candidate);
  } catch {
    // Models sometimes leave a comma before a closing bracket or brace.
    try {
      return JSON.parse(candidate.replace(/,\s*([}\]])/g, "$1"));
    } catch {
      throw new Error("The intro engine returned an unparseable response.");
    }
  }
}

type RawIntro = {
  personAId?: unknown;
  personBId?: unknown;
  score?: unknown;
  rationale?: unknown;
  draftIntro?: unknown;
};

function toParty(contact: Contact): IntroParty {
  return {
    id: contact.id,
    name: contact.name,
    role: contact.role ?? null,
    company: contact.company ?? null,
  };
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Turn the model's raw text into validated suggestions. Anything referencing
 * an unknown id, pairing a person with themselves, duplicating a pair, or
 * naming an already-connected pair is dropped — the engine never trusts the
 * model's output shape blindly.
 */
export function parseIntroSuggestions(
  raw: string,
  contacts: Contact[],
  connections: ExistingConnection[],
  limit: number,
): IntroSuggestion[] {
  const parsed = parseModelJson(raw);

  const list: unknown = Array.isArray(parsed)
    ? parsed
    : (parsed as { intros?: unknown })?.intros;
  if (!Array.isArray(list)) return [];

  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const connected = buildConnectionSet(connections);
  const seen = new Set<string>();
  const suggestions: IntroSuggestion[] = [];

  for (const item of list as RawIntro[]) {
    const aId = typeof item.personAId === "string" ? item.personAId : "";
    const bId = typeof item.personBId === "string" ? item.personBId : "";
    if (!aId || !bId || aId === bId) continue;

    const a = contactById.get(aId);
    const b = contactById.get(bId);
    if (!a || !b) continue;

    const key = pairKey(aId, bId);
    if (seen.has(key)) continue;
    if (isAlreadyConnected(connected, aId, bId)) continue;

    const rationale = typeof item.rationale === "string" ? item.rationale.trim() : "";
    const draftIntro = typeof item.draftIntro === "string" ? item.draftIntro.trim() : "";
    if (!rationale && !draftIntro) continue;

    seen.add(key);
    suggestions.push({
      personA: toParty(a),
      personB: toParty(b),
      score: clampScore(item.score),
      rationale,
      draftIntro,
    });
  }

  suggestions.sort((x, y) => y.score - x.score);
  return suggestions.slice(0, limit);
}
