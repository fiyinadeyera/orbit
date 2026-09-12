// Thin wrapper over Exa's neural search API. Given a person, it pulls recent
// public web context (title, url, a text snippet) that the enrichment route then
// summarizes with Claude. Kept small and dependency-free like the other lib/
// integrations here.

export type ExaResult = {
  title: string | null;
  url: string;
  publishedDate?: string | null;
  text?: string | null;
};

export async function searchPersonContext(
  name: string,
  company: string | null,
): Promise<ExaResult[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) {
    throw new Error("Exa is not configured.");
  }

  const query = company ? `${name}, ${company}` : name;

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query,
      // "auto" lets Exa pick neural vs keyword per query.
      type: "auto",
      numResults: 5,
      // Ask Exa to return page text inline so we get context in one round trip.
      contents: { text: { maxCharacters: 1000 } },
    }),
  });

  if (!response.ok) {
    throw new Error(`Exa search failed with status ${response.status}.`);
  }

  const data = (await response.json()) as { results?: ExaResult[] };
  return data.results ?? [];
}
