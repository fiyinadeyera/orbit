import { formatRoster, type Contact } from "@workspace/intro-engine";

/**
 * Build the ask prompt. The model answers the user's question using only the
 * people and facts in their network, and names the specific people it refers
 * to by id so the route can hydrate them for display.
 */
export function buildAskPrompt(contacts: Contact[], question: string): string {
  const roster = formatRoster(contacts);

  return `You help someone query their own personal network in plain language and get a direct, grounded answer. Think of it as "ask your network and it answers."

Below is their network. Each person is tagged with an id in square brackets.

NETWORK:
${roster}

Their question:
"${question}"

Answer using ONLY the people and facts in the network above. Do not invent people, companies, facts, or details that are not in the notes. If nobody in the network fits the question, say so plainly rather than guessing.

Write in plain, warm language. Never use em dashes (the "—" character); use commas, colons, or periods instead.

Return ONLY a JSON object of this exact shape, no prose, no markdown fences:
{
  "answer": "<a short, direct answer to their question, grounded in the network, one to four sentences; if nobody fits, say so>",
  "matches": [
    { "id": "<id from the network>", "reason": "<one sentence: why this person answers the question>" }
  ]
}

Only use ids that appear in the network above. Order matches best-first. If nobody fits, return an empty matches array and an answer that says nobody in the network fits.`;
}
