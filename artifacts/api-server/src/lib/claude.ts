// A thin text-in/text-out wrapper over the same Anthropic integration the
// relationship extractor uses. Kept generic so anything on the server (the
// intro engine, future features) can borrow the network's Claude access
// without knowing about API keys or request shape.

const DEFAULT_MAX_TOKENS = 4096;

export async function completeClaude(
  prompt: string,
  options: { maxTokens?: number } = {},
): Promise<string> {
  const baseUrl = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Claude is not configured.");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data.content?.find((block) => block.type === "text")?.text;

  if (!text) {
    throw new Error("Claude returned no text response.");
  }

  return text;
}
