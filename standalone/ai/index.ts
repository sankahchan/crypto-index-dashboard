import { completeWithGemini } from "./providers/gemini.js";
import { completeWithOpenAI } from "./providers/openai.js";
import { completeWithAnthropic } from "./providers/anthropic.js";
import { completeWithDeepSeek } from "./providers/deepseek.js";
import type { AIClient, AIEnv, EnvLike, ProviderSettings } from "./types.js";

type ProviderFn = (
  prompt: string,
  jsonSchema: Record<string, unknown>,
  settings: ProviderSettings,
  timeoutMs: number,
) => Promise<unknown>;

const PROVIDERS: Record<string, ProviderFn> = {
  gemini: completeWithGemini,
  openai: completeWithOpenAI,
  anthropic: completeWithAnthropic,
  deepseek: completeWithDeepSeek,
};

const DEFAULT_MODELS: Record<string, string> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-5",
  deepseek: "deepseek-chat",
};

function readSettings(env: EnvLike, name: keyof AIEnv): ProviderSettings {
  const upper = String(name).toUpperCase();
  const key = (suffix: string) => env[`${upper}_${suffix}`]?.trim() ?? "";
  return {
    apiKey: key("API_KEY"),
    model: key("MODEL") || DEFAULT_MODELS[String(name)] || "",
    baseUrl: key("BASE_URL") || undefined,
  };
}

/**
 * Build the AI configuration from environment variables.
 * `AI_PROVIDERS` is a comma-separated priority list, e.g. "gemini,openai,anthropic,deepseek".
 * The older single `AI_PROVIDER` variable is still honored as a one-entry list.
 */
export function loadAIEnv(env: EnvLike): AIEnv {
  const rawList = env.AI_PROVIDERS?.trim() || env.AI_PROVIDER?.trim() || "gemini,openai,anthropic,deepseek";
  const providers = rawList
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p in PROVIDERS);
  return {
    providers,
    gemini: readSettings(env, "gemini"),
    openai: readSettings(env, "openai"),
    anthropic: readSettings(env, "anthropic"),
    deepseek: readSettings(env, "deepseek"),
    timeoutMs: Number.parseInt(env.AI_TIMEOUT_MS ?? "", 10) || 60_000,
  };
}

/**
 * Create an AI client that tries each configured provider in order until one
 * succeeds. Only providers with an API key set are attempted. Throws an
 * aggregated error when every provider fails (or none is configured).
 *
 * Usage:
 *   const ai = createAIClient(process.env);
 *   const raw = await ai.complete(prompt, zodToJsonSchema(myZodSchema));
 *   const parsed = myZodSchema.parse(raw);
 */
export function createAIClient(env: EnvLike): AIClient {
  const config = loadAIEnv(env);
  const active = config.providers.filter((name) => {
    const settings = config[name as keyof Omit<AIEnv, "providers" | "timeoutMs">] as ProviderSettings;
    return settings.apiKey.length > 0;
  });

  return {
    providers: active,
    async complete(prompt, jsonSchema, options) {
      const timeoutMs = options?.timeoutMs ?? config.timeoutMs;
      if (active.length === 0) {
        throw new Error(
          "No AI provider configured. Set at least one of GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, DEEPSEEK_API_KEY.",
        );
      }
      const failures: string[] = [];
      for (const name of active) {
        const settings = config[name as keyof Omit<AIEnv, "providers" | "timeoutMs">] as ProviderSettings;
        try {
          const provider = PROVIDERS[name];
          if (!provider) continue;
          return await provider(prompt, jsonSchema, settings, timeoutMs);
        } catch (error) {
          failures.push(error instanceof Error ? error.message : String(error));
        }
      }
      throw new Error(`All AI providers failed (${active.join(", ")}):\n- ${failures.join("\n- ")}`);
    },
  };
}
