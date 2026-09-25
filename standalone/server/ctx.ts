/**
 * Build the standalone `Ctx` used by the rewritten `server/src/actions.ts`.
 *
 * - `db`: Drizzle ORM over a `bun:sqlite` file at `$DATA_DIR/app.db`
 *   (default `/app/data/app.db`). `drizzle/` migrations run automatically on
 *   boot. The parent directory is created when missing.
 * - `inference`: the existing multi-provider AI adapter from
 *   `standalone/ai/` (`createAIClient(process.env)`). When no provider key is
 *   set, `complete()` throws an `AI_NOT_CONFIGURED`-coded error; every AI
 *   call site in `server/src/actions.ts` already catches inference failures
 *   and falls back to honest empty/degraded states, so the server never
 *   crashes on a keyless install.
 * - `tool.web_search`: pluggable search (see `search.ts`); `[]` when
 *   unconfigured.
 * - `invalidateQueries`: async no-op. The React client invalidates its own
 *   React Query cache after mutations.
 */

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Database } from "bun:sqlite";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { z } from "zod";
import { createAIClient } from "../ai/index.js";
import type { AIError, Ctx } from "./space-sdk-shim.js";
import { webSearch } from "./search.js";

export const AI_NOT_CONFIGURED = "AI_NOT_CONFIGURED";

function asAIError(message: string, code: string): AIError {
  const err = new Error(message) as AIError;
  err.code = code;
  return err;
}

export function createCtx(): Ctx {
  const dataDir = (process.env.DATA_DIR ?? "").trim() || "/app/data";
  mkdirSync(dataDir, { recursive: true });

  const sqlite = new Database(join(dataDir, "app.db"));
  // Pragmas that are safe for a single-writer embedded dashboard DB.
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec("PRAGMA foreign_keys = ON;");

  const db = drizzle(sqlite);

  const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));
  migrate(db, { migrationsFolder });

  const ai = createAIClient(process.env);

  const dbFn = (<S extends Record<string, unknown>>(): BunSQLiteDatabase<S> =>
    db as unknown as BunSQLiteDatabase<S>) as <S extends Record<string, unknown>>() => BunSQLiteDatabase<S>;

  return {
    db: dbFn,
    inference: {
      async complete<T>(prompt: string, options: { schema: z.ZodType<T> }): Promise<T> {
        let raw: unknown;
        try {
          const jsonSchema = z.toJSONSchema(options.schema) as Record<string, unknown>;
          raw = await ai.complete(prompt, jsonSchema);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (/no ai provider configured/i.test(message)) {
            throw asAIError(`${AI_NOT_CONFIGURED}: ${message}`, AI_NOT_CONFIGURED);
          }
          throw err;
        }
        // Mirror the hosted SDK: validate the model's JSON against the
        // caller's zod schema before returning it.
        return options.schema.parse(raw);
      },
    },
    tool: {
      web_search: (query: string, opts?: { language_code?: string; timeout_secs?: number }) =>
        webSearch(query, opts ?? {}),
    },
    invalidateQueries: () => {
      // No-op: the standalone React client invalidates via React Query itself.
    },
  };
}

/** True when at least one AI provider API key is configured. */
export function isAIConfigured(): boolean {
  return createAIClient(process.env).providers.length > 0;
}

export function describeRuntime(): string {
  const dataDir = (process.env.DATA_DIR ?? "").trim() || "/app/data";
  const ai = createAIClient(process.env);
  const searchProvider = (process.env.SEARCH_PROVIDER ?? "").trim().toLowerCase();
  const searchKey = (process.env.SEARCH_API_KEY ?? "").trim();
  return [
    `dataDir=${dataDir}`,
    `aiProviders=${ai.providers.length > 0 ? ai.providers.join(",") : "none"}`,
    `search=${searchProvider && searchKey ? searchProvider : "none"}`,
    `timezone=${(process.env.APP_TIMEZONE ?? "").trim() || "UTC"}`,
  ].join(" ");
}
