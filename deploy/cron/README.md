# Standalone Cron Wiring

The current artifact's schedules are managed by Muse. These notes are for a future standalone deployment after the three protected routes described in `docs/STANDALONE-MIGRATION.md` exist.

## Required variables

- `APP_BASE_URL` — deployed HTTPS origin
- `APP_TIMEZONE` — IANA timezone, for example `Asia/Yangon`
- `CRON_SECRET` — long random server-only value

## Job intent

| Job | Intended cadence |
| --- | --- |
| market refresh | hourly |
| daily market update | daily near 08:22 in `APP_TIMEZONE` |
| weekly digest | Monday near 08:22 in `APP_TIMEZONE` |

## Vercel Cron

Vercel cron expressions are UTC. Convert 08:22 in the chosen `APP_TIMEZONE` to UTC when configuring the project, and re-check the conversion if that timezone observes daylight-saving time. Protect each route by verifying `CRON_SECRET`.

Example `vercel.json` shape (replace the daily/weekly UTC expressions only after choosing the deployment timezone):

```json
{
  "crons": [
    { "path": "/api/cron/market-refresh", "schedule": "17 * * * *" },
    { "path": "/api/cron/daily-market-update", "schedule": "REPLACE_WITH_UTC_CRON" },
    { "path": "/api/cron/weekly-digest", "schedule": "REPLACE_WITH_UTC_CRON" }
  ]
}
```

## GitHub Actions

GitHub-hosted cron is also UTC and can be delayed during high load. Store `APP_BASE_URL` and `CRON_SECRET` as repository or environment secrets, then call the same protected routes with `curl --fail-with-body`. Keep production schedules out of source until the target timezone is confirmed.

```yaml
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger protected job
        env:
          APP_BASE_URL: ${{ secrets.APP_BASE_URL }}
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
        run: |
          test -n "$APP_BASE_URL" && test -n "$CRON_SECRET"
          curl --fail-with-body --retry 2 \
            -X POST \
            -H "Authorization: Bearer $CRON_SECRET" \
            "$APP_BASE_URL/api/cron/market-refresh"
```

## Idempotency

Scheduler retries must be safe. Store one unique run key per job window, such as `daily-market-update:2026-09-25:Asia/Yangon`, before generation begins. If it already exists, return success without generating another report. Manual refresh should use a distinct key and the same underlying service.
