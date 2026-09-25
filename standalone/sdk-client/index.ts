/**
 * Standalone drop-in replacement for `@hatch/space-sdk/client`.
 *
 * The client source (`client/src/api.ts`, `client/src/main.tsx`) imports
 * `createActionClient` and `ActionsClient` from `@hatch/space-sdk/client`.
 * The standalone client build aliases that specifier to this file (see
 * `standalone/build-client.mjs`); `client/src` itself is never modified.
 *
 * Every action is called with a single input argument and proxied to
 * `POST /api/actions/:name` with body `{ input }`. The server replies with
 * `{ ok: true, data }` or `{ ok: false, error: { code, message } }`.
 */

export type ActionCall = (input: Record<string, unknown> | undefined | void) => Promise<unknown>;

/** Same relative API base the client uses today. */
const API_BASE = "/api/actions";

function toError(input: unknown, status: number): Error {
  if (typeof input === "object" && input !== null) {
    const err = (input as { error?: { code?: string; message?: string } }).error;
    if (err && typeof err.message === "string") {
      const wrapped = new Error(`${err.code ?? "ACTION_FAILED"}: ${err.message}`);
      (wrapped as Error & { status?: number }).status = status;
      return wrapped;
    }
  }
  return new Error(`action request failed (HTTP ${status})`);
}

/**
 * Proxy any action name to the standalone HTTP endpoint. The hosted SDK
 * generates typed methods from the actions module; the standalone client
 * takes names dynamically so it stays in sync with `server/src/actions.ts`
 * without codegen. The optional type parameter mirrors the SDK's
 * `createActionClient<typeof Actions>()` signature and is erased at runtime.
 */
export function createActionClient<T = Record<string, ActionCall>>(): T {
  const proxy = new Proxy({} as Record<string, ActionCall>, {
    get(_target, prop: string): ActionCall {
      if (prop === "then") return undefined as unknown as ActionCall;
      return async (input?: Record<string, unknown> | void) => {
        const res = await fetch(`${API_BASE}/${encodeURIComponent(prop)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: input ?? {} }),
        });
        let body: unknown = null;
        try {
          body = await res.json();
        } catch {
          throw new Error(`action request failed (HTTP ${res.status})`);
        }
        if (typeof body === "object" && body !== null && (body as { ok?: boolean }).ok === true) {
          return (body as { data?: unknown }).data;
        }
        throw toError(body, res.status);
      };
    },
  });
  return proxy as unknown as T;
}

/** Kept for type compatibility with `@hatch/space-sdk/client` imports. */
export type ActionsClient = Record<string, ActionCall>;

export interface ApiRequest {
  input: unknown;
}

export type ApiResponse =
  | { ok: true; data: unknown }
  | { ok: false; error: { code: string; message: string } };

/**
 * Shared React Query client. The hosted SDK owns one; the standalone build
 * creates its own so `main.tsx` keeps working unchanged.
 */
import { QueryClient } from "@tanstack/react-query";

export { QueryClient as SpaceQueryClient };
export const spaceQueryClient = new QueryClient();
