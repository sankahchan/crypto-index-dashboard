#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$ROOT/crypto-index-dashboard-github-ready.zip}"

rm -f "$OUT"
cd "$ROOT"

unexpected_env="$(find . -type f -name '.env*' ! -name '.env.example' -print -quit)"
if [[ -n "$unexpected_env" ]]; then
  printf 'Refusing to export while %s exists. Remove it or keep it outside the repository.\n' "$unexpected_env" >&2
  exit 1
fi

zip -rq "$OUT" . \
  -x 'node_modules/*' \
     '.bun-cache/*' \
     '.harness/*' \
     '.space-build/*' \
     '.space-build-cvm/*' \
     'audits/*' \
     'client/dist/*' \
     'client/dist-cvm/*' \
     'server/dist/*' \
     'app.db' 'app.db-shm' 'app.db-wal' \
     '.env' \
     '.media-generation/*' \
     '.xmds-icon' 'AGENTS.md' \
     '*.log' '*.tsbuildinfo*' \
     '*.zip'

printf 'Created %s\n' "$OUT"
