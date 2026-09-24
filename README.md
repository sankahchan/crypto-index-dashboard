# Crypto Index Dashboard (Live)

Bilingual (Myanmar/English) crypto market dashboard with a transparent market-pulse index, cycle-position explorer, historical readings, watchlists and alerts, portfolio tracking, derivatives, on-chain signals, news/whale coverage, a DCA calculator, and AI-authored daily/weekly briefings.

## Repository status

This repository is the **current Muse web artifact source** plus a checked-in standalone migration kit. The app continues to run on Muse today; pushing this repository to GitHub does not move its database or schedules and does not interrupt the hosted artifact.

The current runtime uses:

- React 19 + TypeScript on the client
- typed `@hatch/space-sdk` actions on the server
- SQLite managed by the artifact runtime
- `ctx.inference.complete` for bilingual summaries, sentiment, daily updates, and weekly digests
- managed schedules for hourly market refresh, the daily Market Update, and the Monday digest

Because `@hatch/space-sdk` is a Muse runtime dependency, the current tree is not a one-click standalone deployment. Follow [`docs/STANDALONE-MIGRATION.md`](docs/STANDALONE-MIGRATION.md) to move it to a conventional web stack. A Postgres starting schema is included at [`deploy/postgres/schema.sql`](deploy/postgres/schema.sql), and future cron routes are documented in [`deploy/cron/README.md`](deploy/cron/README.md).

## Current artifact development

Requirements:

- Bun 1.3+
- Access to the Muse web-artifact SDK/runtime

```bash
bun install
bun run typecheck
```

The artifact must be built and published through Muse's web-artifact build flow; `bun run build` only creates local bundles.

## AI: when is Gemini needed?

Gemini is **not** needed for prices, charts, the Market Pulse formula, portfolio math, alerts, DCA calculations, derivatives, or on-chain data. Those features use deterministic code and public data sources.

A standalone deployment does need an AI provider for:

- Myanmar/English news summaries
- news sentiment classification
- the daily Market Update
- the weekly digest
- extracting dated calendar and token-unlock rows from retrieved source material

The Muse-hosted artifact already receives inference through `ctx.inference`; do not add a Gemini key to the current source. During a standalone migration, create one server-only AI adapter and set the variables shown in `.env.example`. Never expose `GEMINI_API_KEY` in client code or commit a real key.

## Data and secrets

- Local runtime databases (`app.db*`), generated bundles, audits, and `.env` files are excluded by `.gitignore`.
- No user portfolio, watchlist, alert, or notification rows are included in the GitHub-ready source archive.
- `DATA-PLAN.md` records source provenance and degraded-state behavior.
- A GitHub repository still needs to be created under the owner's chosen account before this source can be pushed.

## Standalone target checklist

- [ ] Choose a host (for example Vercel, Cloudflare, Fly.io, or Render)
- [ ] Create Postgres (for example Neon or Supabase)
- [ ] Port typed Muse actions to authenticated HTTP/server handlers
- [ ] Replace SQLite Drizzle tables with Postgres tables
- [ ] Replace `ctx.inference` with a server-only AI adapter
- [ ] Add durable job locking/idempotency for scheduled refreshes
- [ ] Configure hourly, daily, and weekly cron triggers
- [ ] Add authentication before importing personal portfolio data
- [ ] Add deployment monitoring and backups

## License

No open-source license has been chosen. All rights remain with the repository owner until a license is added.
