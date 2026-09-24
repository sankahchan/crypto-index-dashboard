import { extractJson, joinParts, postJson, SYSTEM_PROMPT, withSchemaInstruction } from "../http.js";
import type { ProviderSettings } from "../types.js";

interface AnthropicResponse {
  content?: Array<{ type?: string; text?: string }>;
}

/** Anthropic Claude via the Messages REST API. */
export async function completeWithAnthropic(
  prompt: string,
  jsonSchema: Record<string, unknown>,
  settings: ProviderSettings,
  timeoutMs: number,
): Promise<unknown> {
  const body = {
    model: settings.model,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: withSchemaInstruction(prompt, jsonSchema) }],
    temperature: 0.2,
  };
  const data = (await postJson("anthropic", "https://api.anthropic.com/v1/messages", {
    "x-api-key": settings.apiKey,
    "anthropic-version": "2023-06-01",
  }, body, timeoutMs)) as AnthropicResponse;
  const text = joinParts(data.content);
  if (!text) throw new Error("anthropic: empty response");
  return extractJson(text);
}

export const providerName = "anthropic";
