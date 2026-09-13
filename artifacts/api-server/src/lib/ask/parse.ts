import type { Contact } from "@workspace/intro-engine";
import type { AskAnswer, AskMatch } from "./types";

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
  if (!candidate) throw new Error("The ask engine returned an unparseable response.");

  try {
    return JSON.parse(candidate);
  } catch {
    // Models sometimes leave a trailing comma before a closing bracket or brace.
    try {
      return JSON.parse(candidate.replace(/,\s*([}\]])/g, "$1"));
    } catch {
      throw new Error("The ask engine returned an unparseable response.");
    }
  }
}

type RawMatch = { id?: unknown; reason?: unknown };

/**
 * Turn the model's raw text into a validated answer. Any match referencing an
 * id not in the roster, or duplicating one already kept, is dropped, the engine
 * never trusts the model's output shape blindly.
 */
export function parseAskAnswer(raw: string, contacts: Contact[]): AskAnswer {
  const parsed = parseModelJson(raw) as {
    answer?: unknown;
    matches?: unknown;
  };

  const answer = typeof parsed?.answer === "string" ? parsed.answer.trim() : "";

  const knownIds = new Set(contacts.map((c) => c.id));
  const seen = new Set<string>();
  const matches: AskMatch[] = [];

  const list: unknown = Array.isArray(parsed?.matches) ? parsed.matches : [];
  for (const item of list as RawMatch[]) {
    const id = typeof item.id === "string" ? item.id : "";
    if (!id || !knownIds.has(id) || seen.has(id)) continue;

    const reason = typeof item.reason === "string" ? item.reason.trim() : "";
    seen.add(id);
    matches.push({ id, reason });
  }

  return {
    answer: answer || "I could not find an answer in your network.",
    matches,
  };
}
