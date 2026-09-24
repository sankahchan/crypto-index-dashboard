import { completeWithOpenAI } from "./openai.js";
import type { ProviderSettings } from "../types.js";

/**
 * DeepSeek via its OpenAI-compatible Chat Completions endpoint.
 * Reuses the OpenAI implementation with DeepSeek's base URL.
 */
export async function completeWithDeepSeek(
  prompt: string,
  jsonSchema: Record<string, unknown>,
  settings: ProviderSettings,
  timeoutMs: number,
): Promise<unknown> {
  const deepseekSettings: ProviderSettings = {
    ...settings,
    baseUrl: settings.baseUrl ?? "https://api.deepseek.com",
  };
  try {
    return await completeWithOpenAI(prompt, jsonSchema, deepseekSettings, timeoutMs);
  } catch (error) {
    // Re-label errors so the fallback chain reports the right provider.
    if (error instanceof Error && error.message.startsWith("openai:")) {
      throw new Error(error.message.replace(/^openai:/, "deepseek:"));
    }
    throw error;
  }
}

export const providerName = "deepseek";
