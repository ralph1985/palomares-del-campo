#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${PYTHON_BIN:-$(command -v python3 || true)}"
if [[ -z "$PYTHON_BIN" ]]; then
  echo 'Python 3 no está disponible; no se inicia la sincronización de bandos.' >&2
  exit 1
fi

exec "$PYTHON_BIN" "$PROJECT_ROOT/scripts/cron-worktree-lock.py" \
  bash "$PROJECT_ROOT/scripts/sync-bandos-cron-worker.sh" "$@"
