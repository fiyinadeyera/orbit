import { formatExistingConnections, formatRoster } from "./roster";
import type { Contact, ExistingConnection } from "./types";

/**
 * Build the scoring prompt. The model does candidate generation and
 * mutual-value judgement in one pass over the roster — cheaper and far better
 * reasoned than scoring every O(n^2) pair on its own.
 */
export function buildIntroPrompt(
  contacts: Contact[],
  connections: ExistingConnection[],
  limit: number,
): string {
  const roster = formatRoster(contacts);
  const existing = formatExistingConnections(contacts, connections);

  return `You help someone increase their "luck surface area" by spotting valuable introductions to make between people in their network.

Below is their network. Each person is tagged with an id in square brackets.

NETWORK:
${roster}

INTRODUCTIONS THAT ALREADY EXIST (do not re-suggest these):
${existing}

Find the ${limit} introductions with the highest LIKELY MUTUAL VALUE, where connecting two people who are NOT already connected would genuinely benefit BOTH sides. Favour concrete, specific fits: one person is looking for exactly what the other offers (hiring vs. looking, investing vs. raising, a stated need vs. relevant expertise), shared goals, or complementary strengths. Weight fresher relationships slightly higher. Do not invent facts that are not in the notes.

Write the rationale and draftIntro in plain, warm language. Never use em dashes (the "—" character); use commas, colons, or periods instead.

Return ONLY a JSON object of this exact shape, no prose, no markdown fences:
{
  "intros": [
    {
      "personAId": "<id from the network>",
      "personBId": "<a different id from the network>",
      "score": <integer 0-100 for likely mutual value>,
      "rationale": "<one or two sentences: why this intro is worth making and why now, grounded in their notes>",
      "draftIntro": "<a short, warm intro message the user could send to both people, naming each and the specific reason they should meet>"
    }
  ]
}

Only use ids that appear in the network above. Never pair a person with themselves. Order the array by score, highest first. If there are no genuinely valuable introductions to make, return {"intros": []}.`;
}
