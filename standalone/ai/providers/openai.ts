import { extractJson, postJson, SYSTEM_PROMPT, withSchemaInstruction } from "../http.js";
import type { ProviderSettings } from "../types.js";

interface OpenAIResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
}

/**
 * OpenAI via the Chat Completions REST API with `response_format: json_object`.
 * `baseUrl` defaults to https://api.openai.com/v1 and can point at any
 * OpenAI-compatible endpoint.
 */
export async function completeWithOpenAI(
  prompt: string,
  jsonSchema: Record<string, unknown>,
  settings: ProviderSettings,
  timeoutMs: number,
): Promise<unknown> {
  const base = (settings.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const body = {
    model: settings.model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: withSchemaInstruction(prompt, jsonSchema) },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  };
  const data = (await postJson("openai", `${base}/chat/completions`, {
    Authorization: `Bearer ${settings.apiKey}`,
  }, body, timeoutMs)) as OpenAIResponse;
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("openai: empty response");
  return extractJson(text);
}

export const providerName = "openai";
