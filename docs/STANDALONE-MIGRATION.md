# Standalone Web App Migration

## 1. Keep the current artifact stable

Treat the current Muse artifact as the reference implementation while the standalone app is developed on a separate branch. GitHub stores source history; it does not keep the Muse schedules or `app.db` running.

Recommended branches:

- `main`: stable source snapshot
- `standalone`: runtime migration work

## 2. Target architecture

A practical first deployment is:

- **UI:** the existing React components and `theme.css`
- **Server:** framework server routes (Next.js/Remix/Hono are all viable)
- **Database:** Postgres on Neon or Supabase
- **AI:** one server-only provider adapter; Gemini can be the first implementation
- **Schedules:** Vercel Cron, GitHub Actions, or the host's job scheduler
- **Secrets:** deployment environment variables, never browser variables

Keep the client-facing action contract stable while replacing the transport. The current `client/src/api.ts` proxy should become an HTTP client with the same request and response types. This lets the UI migrate before every backend detail is rewritten.

## 3. Runtime boundaries to replace

| Current Muse capability | Standalone replacement |
| --- | --- |
| `defineAction` | authenticated server route / RPC procedure |
| `ctx.db` | Drizzle Postgres client |
| `ctx.inference.complete` | `AiProvider.completeStructured()` on the server |
| `ctx.tool.webSearch` | approved search/news ingestion provider on the server |
| `ctx.invalidateQueries` | API response + React Query invalidation |
| managed artifact schedules | host cron calling protected internal routes |

Do not call Gemini, the database, or upstream news APIs directly from the browser.

## 4. Database migration

1. Create an empty Postgres database.
2. Apply `deploy/postgres/schema.sql`.
3. Generate a Drizzle Postgres schema from that SQL or port `server/src/schema.ts` table-by-table.
4. Verify uniqueness and indexes before importing any user-owned state.
5. Import only an explicit user export; do not copy `app.db` into GitHub.

SQLite timestamps are stored as epoch milliseconds. The Postgres starter schema uses `timestamptz`; the migration script must convert each value with `to_timestamp(milliseconds / 1000.0)`.

Large JSON payloads are stored as `jsonb` in Postgres. Validate them with the same Zod response schemas before writing or returning them.

## 5. AI provider adapter

Expose one internal interface rather than using Gemini throughout route code:

```ts
export interface AiProvider {
  completeStructured<T>(input: {
    instruction: string;
    schemaName: string;
    schema: unknown;
  }): Promise<T>;
}
```

The Gemini implementation reads `GEMINI_API_KEY` and `GEMINI_MODEL` only on the server. Keep deterministic fallback behavior from the current artifact: sourced stories still render when classification is unavailable; saved daily/weekly reports remain visible and are marked stale if regeneration fails.

Recommended guardrails:

- validate every AI response against the existing Zod schema
- send only the source readings/headlines needed for that task
- reject invented dates, prices, events, flows, and source URLs
- keep source URLs from retrieval output unchanged
- log provider status and latency, but never prompts containing private portfolio data

## 6. Scheduled jobs

Create three protected, idempotent routes:

- `POST /api/cron/market-refresh` — hourly
- `POST /api/cron/daily-market-update` — daily near 08:22 in `APP_TIMEZONE`
- `POST /api/cron/weekly-digest` — Mondays near 08:22 in `APP_TIMEZONE`

Each route must:

1. require `Authorization: Bearer <CRON_SECRET>`;
2. acquire a database lock/idempotency key for the intended time window;
3. call the same service used by manual refresh;
4. return a short status object without leaking secrets or internal prompts;
5. preserve the latest valid cached data when an upstream provider fails.

See `deploy/cron/README.md` for scheduler examples. The exact UTC cron expression depends on `APP_TIMEZONE` and daylight-saving policy, so do not commit a guessed production schedule.

## 7. Authentication and personal state

A public standalone deployment must add authentication before enabling portfolio, watchlist, alert, or notification writes. Every user-owned table needs an owner key and every query/mutation must filter by that key. The included Postgres schema intentionally mirrors the current single-user shape; add tenancy before a multi-user launch.

Do not turn browser notifications into a promise of background push. True background push requires service-worker registration, a push provider, device subscriptions, revocation controls, and a privacy policy.

## 8. Deployment order

1. Deploy a read-only market dashboard against public sources.
2. Add Postgres caching and scheduled market refresh.
3. Add authenticated personal state.
4. Add Gemini-backed bilingual summaries and reports.
5. Add notification delivery only after subscription and consent flows exist.
6. Compare standalone outputs with the current artifact, then switch traffic deliberately.

## 9. Verification gates

Before launch, verify:

- mobile and desktop layout in light/dark/auto modes
- source outages show honest empty/stale states
- cron retries cannot duplicate alerts or reports
- all mutation routes require authentication and CSRF-safe transport
- rate limits and timeouts exist for every upstream API
- no secret appears in the browser bundle or logs
- database backups and restore are tested
- AI output is schema-validated and source-linked
