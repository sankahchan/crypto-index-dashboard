import { extractJson, joinParts, postJson, SYSTEM_PROMPT } from "../http.js";
import type { ProviderSettings } from "../types.js";

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

/** Google Gemini via the Generative Language REST API. Supports native JSON schema mode. */
export async function completeWithGemini(
  prompt: string,
  jsonSchema: Record<string, unknown>,
  settings: ProviderSettings,
  timeoutMs: number,
): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(settings.model)}:generateContent?key=${encodeURIComponent(settings.apiKey)}`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: jsonSchema,
      temperature: 0.2,
    },
  };
  const data = (await postJson("gemini", url, {}, body, timeoutMs)) as GeminiResponse;
  const text = joinParts(data.candidates?.[0]?.content?.parts);
  if (!text) throw new Error("gemini: empty response");
  return extractJson(text);
}

export const providerName = "gemini";
