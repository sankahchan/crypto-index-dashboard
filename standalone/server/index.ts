/**
 * Standalone Crypto Index Dashboard server (Bun + SQLite).
 *
 * HTTP API:
 *   GET  /api/health                      -> { ok, version, uptime_s, runtime }
 *   POST /api/actions/:name  {input}       -> { ok: true, data } | { ok: false, error: { code, message } }
 *   POST /api/refresh/:job  (x-cron-secret)-> run market|daily|weekly refresh on demand
 *   GET  /*                                 -> built client (SPA fallback)
 *
 * Static assets are served from the `client/dist` directory produced by the
 * standalone client build. `server/src/actions.ts` is reused verbatim except
 * for its `@hatch/space-sdk` import (see `build-actions.mjs`).
 */

import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createCtx, describeRuntime, isAIConfigured } from "./ctx.js";
import { startScheduler } from "./scheduler.js";
import { Actions } from "./.build/actions.js";
import type { AIError } from "./space-sdk-shim.js";
import { invokeHandler } from "./space-sdk-shim.js";

const PORT = Number((process.env.PORT ?? "").trim() || 3000);
const DIST = resolve(fileURLToPath(new URL("../../client/dist", import.meta.url)));
const VERSION = "standalone-1";

const ctx = createCtx();
startScheduler(ctx);

interface ErrorBody {
  code: string;
  message: string;
}

function toErrorBody(err: unknown): ErrorBody {
  if (typeof err === "object" && err !== null && "code" in err && typeof (err as AIError).code === "string") {
    const coded = err as AIError;
    return { code: coded.code ?? "UNKNOWN", message: err instanceof Error ? err.message : String(err) };
  }
  const message = err instanceof Error ? err.message : String(err);
  return { code: "ACTION_FAILED", message };
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

async function handleAction(name: string, req: Request): Promise<Response> {
  const action = (
    Actions as Record<
      string,
      | {
          request?: { parse(data: unknown): unknown };
          response?: { parse(data: unknown): unknown };
          handler: (...args: any[]) => Promise<unknown>;
        }
      | undefined
    >
  )[name];
  if (!action) return json({ ok: false, error: { code: "NOT_FOUND", message: `unknown action: ${name}` } }, 404);

  let input: unknown = {};
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { input?: unknown };
      input = body?.input ?? {};
    }
  } catch {
    return json({ ok: false, error: { code: "BAD_REQUEST", message: "invalid JSON body" } }, 400);
  }

  try {
    const parsed = action.request ? action.request.parse(input) : input;
    const data = await invokeHandler(action.handler, ctx, parsed);
    if (action.response) action.response.parse(data);
    return json({ ok: true, data });
  } catch (err) {
    const error = toErrorBody(err);
    console.warn(`[action] ${name} -> ${error.code}: ${error.message}`);
    return json({ ok: false, error }, 500);
  }
}

const REFRESH_JOBS: Record<string, () => Promise<unknown>> = {
  market: () =>
    invokeHandler(Actions.refreshMarketData.handler, ctx, {}).then(() =>
      invokeHandler(Actions.refreshMarketIntelligence.handler, ctx, {}),
    ),
  daily: () => invokeHandler(Actions.refreshDailyMarketUpdate.handler, ctx, {}),
  weekly: () => invokeHandler(Actions.refreshWeeklyMarketDigest.handler, ctx, {}),
};

async function handleRefresh(job: string, req: Request): Promise<Response> {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret) {
    return json({ ok: false, error: { code: "CRON_DISABLED", message: "CRON_SECRET is not configured" } }, 403);
  }
  const provided = (req.headers.get("x-cron-secret") ?? "").trim();
  if (!provided || provided !== secret) {
    return json({ ok: false, error: { code: "FORBIDDEN", message: "bad x-cron-secret" } }, 403);
  }
  const run = REFRESH_JOBS[job];
  if (!run) return json({ ok: false, error: { code: "NOT_FOUND", message: `unknown refresh job: ${job}` } }, 404);
  try {
    await run();
    return json({ ok: true });
  } catch (err) {
    const error = toErrorBody(err);
    return json({ ok: false, error }, 500);
  }
}

function safeJoin(base: string, rel: string): string | null {
  const resolved = resolve(join(base, rel));
  if (resolved !== base && !resolved.startsWith(base + sep)) return null;
  return resolved;
}

async function serveStatic(pathname: string): Promise<Response | null> {
  let rel = decodeURIComponent(pathname);
  if (rel === "" || rel.endsWith("/")) rel += "index.html";
  const filePath = safeJoin(DIST, rel.replace(/^\/+/, ""));
  if (!filePath) return null;
  const file = Bun.file(filePath);
  if (!(await file.exists())) return null;
  return new Response(file);
}

async function serveSpaFallback(): Promise<Response> {
  const indexPath = safeJoin(DIST, "index.html");
  if (!indexPath) return new Response("not found", { status: 404 });
  const file = Bun.file(indexPath);
  if (!(await file.exists())) {
    return new Response("client not built: run the standalone client build first", { status: 503 });
  }
  return new Response(file);
}

const startedAt = Date.now();

Bun.serve({
  port: PORT,
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname === "/api/health" && req.method === "GET") {
      return json({
        ok: true,
        version: VERSION,
        uptime_s: Math.floor((Date.now() - startedAt) / 1000),
        runtime: describeRuntime(),
        aiConfigured: isAIConfigured(),
      });
    }

    const actionMatch = /^\/api\/actions\/([A-Za-z0-9_]+)$/.exec(pathname);
    if (actionMatch) {
      if (req.method !== "POST") {
        return json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "use POST" } }, 405);
      }
      return handleAction(actionMatch[1] ?? "", req);
    }

    const refreshMatch = /^\/api\/refresh\/([A-Za-z0-9_]+)$/.exec(pathname);
    if (refreshMatch) {
      if (req.method !== "POST") {
        return json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "use POST" } }, 405);
      }
      return handleRefresh(refreshMatch[1] ?? "", req);
    }

    if (pathname.startsWith("/api/")) {
      return json({ ok: false, error: { code: "NOT_FOUND", message: "unknown API route" } }, 404);
    }

    const asset = await serveStatic(pathname);
    if (asset) return asset;
    return serveSpaFallback();
  },
  error(err: unknown) {
    console.error("[server] uncaught:", err instanceof Error ? err.message : String(err));
    return new Response("internal server error", { status: 500 });
  },
});

console.log(`[server] listening on :${PORT}`);
console.log(`[server] ${describeRuntime()}`);
