#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PNPM_BIN="${PNPM_BIN:-$(command -v pnpm || true)}"
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3 || true)}"

if [[ -z "$PNPM_BIN" ]]; then
  echo 'pnpm no está disponible; no se inicia el descubrimiento de noticias.' >&2
  exit 1
fi
if [[ -z "$PYTHON_BIN" ]]; then
  echo 'Python 3 no está disponible; no se inicia el descubrimiento de noticias.' >&2
  exit 1
fi

cd "$PROJECT_ROOT"
exec "$PYTHON_BIN" scripts/cron-worktree-lock.py \
  "$PNPM_BIN" exec tsx scripts/discover-news.ts "$@"
