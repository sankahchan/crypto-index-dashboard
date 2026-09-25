#!/usr/bin/env bash
#
# Crypto Index Dashboard — one-command VPS installer (Ubuntu/Debian).
#
# Installs Docker (if missing), clones or updates this repo, creates .env
# from .env.example on first run only, then builds and starts the app with
# Docker Compose. Safe to re-run: it updates the code and redeploys without
# touching your existing .env or database volume.
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/sankahchan/crypto-index-dashboard/main/deploy/vps-install.sh | bash
#
set -euo pipefail

REPO_URL="https://github.com/sankahchan/crypto-index-dashboard.git"
BRANCH="main"
APP_DIR="${APP_DIR:-$HOME/crypto-index-dashboard}"
PORT="${PORT:-3000}"

log() { printf '\033[1;32m[install]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[install]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31m[install]\033[0m %s\n' "$*" >&2; exit 1; }

# ---- 1. Docker ------------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Docker not found — installing via get.docker.com (needs root/sudo)..."
  if [ "$(id -u)" -eq 0 ]; then
    curl -fsSL https://get.docker.com | sh
  elif command -v sudo >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com | sudo sh
  else
    die "Docker is not installed and no sudo available. Install Docker, then re-run."
  fi
fi

# Use sudo for docker commands when the current user cannot reach the daemon.
DOCKER="docker"
if ! docker info >/dev/null 2>&1; then
  if command -v sudo >/dev/null 2>&1 && sudo docker info >/dev/null 2>&1; then
    warn "Using sudo for docker commands (consider adding your user to the 'docker' group)."
    DOCKER="sudo docker"
  else
    die "Cannot talk to the Docker daemon. Start Docker or fix permissions, then re-run."
  fi
fi

if ! $DOCKER compose version >/dev/null 2>&1; then
  die "The 'docker compose' plugin is missing. Install docker-compose-plugin, then re-run."
fi

# git is needed to fetch the repo
if ! command -v git >/dev/null 2>&1; then
  log "git not found — installing..."
  if [ "$(id -u)" -eq 0 ]; then
    apt-get update -qq && apt-get install -y -qq git curl
  else
    sudo apt-get update -qq && sudo apt-get install -y -qq git curl
  fi
fi

# ---- 2. Clone or update -----------------------------------------------------
if [ -d "$APP_DIR/.git" ]; then
  log "Updating existing checkout in $APP_DIR ..."
  git -C "$APP_DIR" fetch --quiet origin
  git -C "$APP_DIR" checkout --quiet "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
else
  log "Cloning $REPO_URL into $APP_DIR ..."
  git clone --quiet --depth 1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# ---- 3. .env (first run only) ----------------------------------------------
if [ ! -f .env ]; then
  log "Creating .env from .env.example — add your API keys there if you want AI/news features."
  cp .env.example .env
else
  log ".env already exists — leaving it untouched."
fi

# ---- 4. Build & start -------------------------------------------------------
log "Building and starting the dashboard (this takes a few minutes on first run)..."
$DOCKER compose up -d --build

log "Waiting for the app to become healthy..."
for i in $(seq 1 30); do
  if curl -fsS --max-time 5 "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 5
done

HEALTH="$(curl -fsS --max-time 10 "http://127.0.0.1:${PORT}/api/health" 2>/dev/null || true)"
if [ -z "$HEALTH" ]; then
  die "The app did not become healthy. Inspect with: cd $APP_DIR && docker compose logs -f"
fi

PUBLIC_IP="$(curl -fsS --max-time 10 https://ifconfig.me 2>/dev/null || echo localhost)"
log "Done! Dashboard: http://${PUBLIC_IP}:${PORT}"
log "Health: $HEALTH"
log "Data (SQLite) persists in the 'app-data' Docker volume across redeploys."
log "Tip: put your AI/search API keys in $APP_DIR/.env, then re-run this script."
