/**
 * Shared types for the standalone multi-provider AI adapter.
 *
 * Server-only: never import these modules from client code. API keys must
 * stay on the server. This adapter is part of the standalone migration kit;
 * the Muse-hosted artifact keeps using `ctx.inference.complete` and does not
 * read these files.
 */

export interface AICompleteOptions {
  /** Abort a single provider attempt after this many milliseconds. Defaults to 60_000. */
  timeoutMs?: number;
}

export interface AIClient {
  /**
   * Ask the model to return a single JSON object matching `jsonSchema`.
   * Providers are tried in the configured order until one succeeds; if every
   * provider fails, an aggregated error is thrown.
   */
  complete(
    prompt: string,
    jsonSchema: Record<string, unknown>,
    options?: AICompleteOptions,
  ): Promise<unknown>;

  /** Provider names that have API keys configured, in attempt order. */
  readonly providers: string[];
}

export interface ProviderSettings {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface AIEnv {
  /** Ordered provider names, e.g. ["gemini", "openai", "anthropic", "deepseek"]. */
  providers: string[];
  gemini: ProviderSettings;
  openai: ProviderSettings;
  anthropic: ProviderSettings;
  deepseek: ProviderSettings;
  timeoutMs: number;
}

/** Minimal shape of `process.env` (or any string map) used to configure the client. */
export type EnvLike = { readonly [key: string]: string | undefined };
