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

Because `@hatch/space-sdk` is a Muse runtime dependency, the hosted artifact cannot run elsewhere as-is. The `standalone/` runtime in this repo solves that: a Bun + SQLite server that reuses `server/src/actions.ts` verbatim (only its SDK import is rewritten at build time), serves the React client from `client/dist/`, and runs the hourly/daily/weekly schedules in-process. See [Run on a VPS](#run-on-a-vps-one-command) below for the one-command deployment.

## Run on a VPS (one command)

Requirements: an Ubuntu/Debian VPS with outbound internet (1 vCPU / 1 GB RAM is enough). The installer sets up Docker if it is missing.

```bash
curl -sSL https://raw.githubusercontent.com/sankahchan/crypto-index-dashboard/main/deploy/vps-install.sh | bash
```

Then open `http://<your-vps-ip>:3000`. The script is idempotent: re-running it pulls the latest code and redeploys without touching your `.env` or the database volume.

Manual alternative (after cloning):

```bash
cp .env.example .env   # first time only; add API keys as wanted
docker compose up -d --build
```

How it works: the multi-stage `Dockerfile` installs dependencies with Bun, rewrites `server/src/actions.ts` to use the local SDK shim (`standalone/server/space-sdk-shim.ts`), typechecks the standalone server, builds the React client into `client/dist/`, and ships a minimal `oven/bun` runtime image. Data lives in SQLite at `DATA_DIR` (default `/app/data`), persisted in the `app-data` Docker volume. Migrations in `drizzle/` run automatically on boot.

Built-in schedules (no external cron needed):

| Job | Cadence |
| --- | --- |
| Market data + intelligence refresh | hourly (first run ~15 s after boot) |
| Daily Market Update (Myanmar/English) | daily ~08:22 in `APP_TIMEZONE` |
| Weekly digest (Myanmar/English) | Monday ~08:22 in `APP_TIMEZONE` |

`POST /api/refresh/{market,daily,weekly}` with an `x-cron-secret` header (matching `CRON_SECRET`) lets an external cron trigger the same jobs; the endpoint is disabled when `CRON_SECRET` is empty. `GET /api/health` reports version, uptime, and whether AI/search are configured.

### Which features need API keys?

No keys are required for prices, charts, the Market Pulse index, cycle position, portfolio math, alerts, watchlists, DCA tools, funding/open interest, liquidation levels, token unlocks, or on-chain data — those use deterministic code and public sources.

Optional keys unlock the rest:

| Key(s) | Enables |
| --- | --- |
| `GEMINI_API_KEY` / `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `DEEPSEEK_API_KEY` (any one; priority via `AI_PROVIDERS`) | AI market briefs, news-sentiment classification, trading-signal AI assessments, daily/weekly AI briefings |
| `SEARCH_PROVIDER=tavily` + `SEARCH_API_KEY` (or `brave`) | news pipeline feeding sentiment and market intelligence |

Without keys, AI/search-dependent sections degrade honestly (empty or "not configured" states) instead of failing.

## Current artifact development

Requirements:

- Bun 1.3+
- Access to the Muse web-artifact SDK/runtime

```bash
bun install
bun run typecheck
```

The artifact must be built and published through Muse's web-artifact build flow; `bun run build` only creates local bundles.

## AI: when is it needed, and which provider?

AI is **not** needed for prices, charts, the Market Pulse formula, portfolio math, alerts, DCA calculations, derivatives, or on-chain data. Those features use deterministic code and public data sources.

A standalone deployment does need an AI provider for:

- Myanmar/English news summaries
- news sentiment classification
- the daily Market Update
- the weekly digest
- extracting dated calendar and token-unlock rows from retrieved source material

Four providers are supported with automatic fallback, in your chosen priority order (`AI_PROVIDERS` in `.env.example`): **Gemini**, **OpenAI (ChatGPT)**, **Anthropic (Claude)**, **DeepSeek**. If one fails — quota, network, bad key, empty response — the next is tried automatically; an error is raised only when all fail. The ready-to-port adapter lives in `standalone/ai/` (see its README).

The Muse-hosted artifact already receives inference through `ctx.inference`; do not add API keys to the current source. During a standalone migration, wire `createAIClient(process.env)` into the four `ctx.inference.complete` call sites and set the keys shown in `.env.example`. Never expose API keys in client code or commit a real key.

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
- [ ] Port `ctx.inference` call sites to the multi-provider AI adapter in `standalone/ai/` (Gemini/OpenAI/Claude/DeepSeek with fallback)
- [ ] Add durable job locking/idempotency for scheduled refreshes
- [ ] Configure hourly, daily, and weekly cron triggers
- [ ] Add authentication before importing personal portfolio data
- [ ] Add deployment monitoring and backups

## License

No open-source license has been chosen. All rights remain with the repository owner until a license is added.
