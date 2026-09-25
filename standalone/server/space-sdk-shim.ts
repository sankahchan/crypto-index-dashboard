/**
 * Standalone drop-in replacement for `@hatch/space-sdk` (server side).
 *
 * The Muse-hosted artifact imports `defineAction`, `z`, `Ctx` and
 * `ActionsModule` from `@hatch/space-sdk`. That package only exists inside the
 * Muse runtime, so the standalone VPS server rewrites the single SDK import in
 * `server/src/actions.ts` to point at this shim (see `build-actions.mjs`).
 * `server/src` itself is never modified.
 *
 * The shapes below mirror what `server/src/actions.ts` actually consumes:
 * - `inference.complete` is generic over the caller's zod schema and returns
 *   the schema-validated output type (like the hosted SDK).
 * - `tool.web_search` resolves to `{ content: { results: [...] } }`.
 * - `defineAction` keeps each action's inferred handler arity (some handlers
 *   declare `(ctx)`, others `(ctx, args)`); use `invokeHandler` to call one
 *   uniformly from standalone-only code.
 */

import { z } from "zod";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

export { z };

/** One web-search result, matching what `server/src/actions.ts` consumes. */
export interface WebSearchItem {
  title: string;
  snippet: string | null;
  source: string | null;
  url: string | null;
  published_at: string | null;
}

export interface WebSearchResponse {
  content: {
    results: WebSearchItem[];
  };
}

export interface AIError extends Error {
  code?: string;
}

export interface InferenceClient {
  /**
   * Ask the model to return a single JSON object matching `options.schema`.
   * The result is validated against the zod schema before it is returned,
   * mirroring the hosted SDK, and typed as the schema's output.
   *
   * Throws an error with `code === "AI_NOT_CONFIGURED"` when no AI provider
   * API key is set.
   */
  complete<T>(prompt: string, options: { schema: z.ZodType<T> }): Promise<T>;
}

export interface ToolClient {
  web_search(
    query: string,
    opts?: { language_code?: string; timeout_secs?: number },
  ): Promise<WebSearchResponse>;
}

/**
 * Standalone equivalent of the hosted SDK's `Ctx`.
 * - `db` is a generic function (as in the hosted SDK): call
 *   `ctx.db<typeof schema>()` to get the Drizzle SQLite database.
 * - `invalidateQueries` is a no-op: the React client invalidates its own
 *   React Query cache after mutations.
 */
export interface Ctx {
  db: <S extends Record<string, unknown>>() => BunSQLiteDatabase<S>;
  inference: InferenceClient;
  tool: ToolClient;
  invalidateQueries: () => void;
}

export interface ActionDefinition {
  request?: { parse(data: unknown): unknown };
  response?: { parse(data: unknown): unknown };
  handler: (ctx: Ctx, args: any) => Promise<unknown>;
}

export type ActionsModule = Record<string, ActionDefinition>;

/**
 * Register an action. The generic keeps each action's declared object intact
 * (including its handler's real arity) while giving `handler` contextual
 * types for `ctx`, so the rewritten `server/src/actions.ts` typechecks
 * without the real SDK.
 */
export function defineAction<D extends ActionDefinition>(definition: D): D {
  return definition;
}

/**
 * Call an action's handler uniformly as `(ctx, args)`. Declared handlers take
 * either `(ctx)` or `(ctx, args)`; extra arguments are ignored at runtime, so
 * this cast is safe. Prefer this over calling `.handler` directly from
 * standalone-only code, where the inferred per-action arity would otherwise
 * fail typechecking.
 */
export function invokeHandler(
  handler: (...args: any[]) => Promise<unknown>,
  ctx: Ctx,
  args: unknown,
): Promise<unknown> {
  return (handler as (ctx: Ctx, args: unknown) => Promise<unknown>)(ctx, args);
}
