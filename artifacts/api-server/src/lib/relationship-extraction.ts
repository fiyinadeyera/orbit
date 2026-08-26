export type ExtractedRelationship = {
  name: string;
  company: string | null;
  role: string | null;
  location: string | null;
  interests: string[];
  connectedTo: string[];
  context: string | null;
  date: string;
  status: string | null;
};

const today = () => new Date().toISOString().slice(0, 10);

function cleanJson(value: string): string {
  return value.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

export async function extractRelationship(
  note: string,
): Promise<ExtractedRelationship> {
  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Claude extraction is not configured.");
  }

  const prompt = `Extract structured information from the following note about a person the user met. Return only JSON with these fields: name, company, role, location, interests (array), connected_to (array of names mentioned), context (how/where they met), date (if mentioned, otherwise today), status (any goals or things they mentioned looking for). Note: ${note}`;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude extraction failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data.content?.find((block) => block.type === "text")?.text;

  if (!text) {
    throw new Error("Claude returned no extractable response.");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleanJson(text)) as Record<string, unknown>;
  } catch {
    throw new Error("Claude returned an invalid extraction response.");
  }

  const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
  if (!name) {
    throw new Error("Claude could not identify a person in that note.");
  }

  const asNullableString = (value: unknown): string | null =>
    typeof value === "string" && value.trim() ? value.trim() : null;
  const asStringArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim())
      : [];
  const dateValue =
    typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
      ? parsed.date
      : today();

  return {
    name,
    company: asNullableString(parsed.company),
    role: asNullableString(parsed.role),
    location: asNullableString(parsed.location),
    interests: asStringArray(parsed.interests),
    connectedTo: asStringArray(parsed.connected_to),
    context: asNullableString(parsed.context),
    date: dateValue,
    status: asNullableString(parsed.status),
  };
}