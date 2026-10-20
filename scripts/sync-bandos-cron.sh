#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP_ROOT="${TMPDIR:-/tmp}"
LOCK_FILE="$TEMP_ROOT/palomares-del-campo-bandos.lock"
PNPM_BIN="${PNPM_BIN:-$(command -v pnpm || true)}"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"
GH_BIN="${GH_BIN:-$(command -v gh || true)}"

WORKTREE_DIR=''
PR_URL=''
PR_NUMBER=''
PHASE='inicio'
FAILED_COMMAND=''
FAILED_LINE=''

cleanup_worktree() {
  if [[ -n "$WORKTREE_DIR" && -d "$WORKTREE_DIR" ]]; then
    /usr/bin/git -C "$PROJECT_ROOT" worktree remove --force "$WORKTREE_DIR" >/dev/null 2>&1 || true
    WORKTREE_DIR=''
  fi
}

on_error() {
  FAILED_COMMAND="$BASH_COMMAND"
  FAILED_LINE="$LINENO"
}

on_exit() {
  local exit_code="$?"
  cleanup_worktree
  if (( exit_code != 0 )); then
    echo "Sincronización de bandos fallida en la fase '$PHASE' (línea ${FAILED_LINE:-desconocida}): ${FAILED_COMMAND:-comando desconocido}" >&2
    if [[ -n "$PR_URL" ]]; then
      echo "La PR queda abierta para revisión: $PR_URL" >&2
    fi
  fi
  exit "$exit_code"
}

trap on_error ERR
trap on_exit EXIT

exec 9>"$LOCK_FILE"
if ! /usr/bin/flock -n 9; then
  echo 'Otra sincronización de bandos ya está en ejecución; se omite esta ejecución.'
  exit 0
fi

if [[ -z "$PNPM_BIN" || -z "$NODE_BIN" || -z "$GH_BIN" ]]; then
  PHASE='comprobación de herramientas'
  echo 'pnpm, Node.js o gh no están disponibles; se cancela la sincronización.' >&2
  exit 1
fi

cd "$PROJECT_ROOT"

PHASE='alineación de main antes de leer el RSS'
"$PNPM_BIN" exec tsx scripts/ensure-main-synced.ts

PHASE='autenticación de GitHub'
"$GH_BIN" auth status >/dev/null
GH_TOKEN="$("$GH_BIN" auth token)"
export GH_TOKEN
REPOSITORY="$("$GH_BIN" repo view --json nameWithOwner --jq '.nameWithOwner')"

PHASE='detección de una PR de bandos pendiente'
open_pr_json="$("$GH_BIN" pr list \
  --state open \
  --base main \
  --json number,title,headRefName,url,state \
  --limit 100)"
open_pr="$(printf '%s' "$open_pr_json" | "$PNPM_BIN" exec tsx --eval '
  import fs from "node:fs";
  import { findOpenBandosPullRequest } from "./scripts/bandos-sync-policy.ts";

  const pullRequest = findOpenBandosPullRequest(JSON.parse(fs.readFileSync(0, "utf8")));
  if (pullRequest) {
    process.stdout.write(
      [pullRequest.number, pullRequest.url, pullRequest.headRefName].join("\t"),
    );
  }
')"

if [[ -n "$open_pr" ]]; then
  IFS=$'\t' read -r PR_NUMBER PR_URL WORKTREE_BRANCH <<< "$open_pr"
  echo "PR de bandos ya abierta; se actualiza con la última main y se reanudan sus checks: $PR_URL"
  PHASE='actualización de la rama de una PR existente'
  "$GH_BIN" pr update-branch "$PR_NUMBER"
else
  PHASE='preparación del worktree desde origin/main'
  /usr/bin/git fetch origin main
  WORKTREE_DIR="$(mktemp -d "$TEMP_ROOT/palomares-del-campo-bandos.XXXXXX")"
  rmdir "$WORKTREE_DIR"
  /usr/bin/git worktree add --detach "$WORKTREE_DIR" origin/main

  PHASE='instalación de dependencias en el worktree'
  (
    cd "$WORKTREE_DIR"
    "$PNPM_BIN" install --frozen-lockfile --prefer-offline
  )

  PHASE='descarga incremental del RSS municipal'
  (
    cd "$WORKTREE_DIR"
    "$PNPM_BIN" run fetch-bandos
  )

  if
    /usr/bin/git -C "$WORKTREE_DIR" diff --quiet -- src/content/bandos &&
    [[ -z "$(/usr/bin/git -C "$WORKTREE_DIR" status --porcelain -- src/content/bandos)" ]]
  then
    echo 'No hay bandos nuevos o actualizados.'
    if [[ "${SYNC_BANDOS_DRY_RUN:-0}" == '1' ]]; then
      echo 'Dry run: se omite la sincronización de main hacia develop.'
      exit 0
    fi
    PHASE='reconciliación de main hacia develop'
    "$PNPM_BIN" exec tsx scripts/sync-main-to-develop.ts
    exit 0
  fi

  PHASE='validación de la sincronización'
  (
    cd "$WORKTREE_DIR"
    "$PNPM_BIN" run format:check
    "$PNPM_BIN" run lint
    "$PNPM_BIN" run test
    "$PNPM_BIN" run build
  )

  if [[ "${SYNC_BANDOS_DRY_RUN:-0}" == '1' ]]; then
    echo 'Dry run completado; no se creó PR ni se enviaron cambios.'
    exit 0
  fi

  PHASE='preparación de la rama de la PR'
  WORKTREE_BRANCH="$("$PNPM_BIN" exec tsx --eval '
    import { buildBandosBranchName } from "./scripts/bandos-sync-policy.ts";
    process.stdout.write(buildBandosBranchName());
  ')"
  /usr/bin/git -C "$WORKTREE_DIR" switch -c "$WORKTREE_BRANCH"
  /usr/bin/git -C "$WORKTREE_DIR" add -- src/content/bandos
  /usr/bin/git -C "$WORKTREE_DIR" diff --cached --check

  while IFS= read -r changed_file; do
    case "$changed_file" in
      src/content/bandos/*.md) ;;
      *)
        echo "Archivo inesperado en la sincronización de bandos: $changed_file" >&2
        exit 1
        ;;
    esac
  done < <(/usr/bin/git -C "$WORKTREE_DIR" diff --cached --name-only)

  PHASE='commit de la rama de la PR'
  /usr/bin/git -C "$WORKTREE_DIR" commit -m 'chore(bandos): sync municipal notices'

  PHASE='publicación de la rama de la PR'
  /usr/bin/git -C "$WORKTREE_DIR" push --set-upstream origin "$WORKTREE_BRANCH"

  PHASE='creación de la Pull Request'
  PR_URL="$("$GH_BIN" pr create \
    --base main \
    --head "$WORKTREE_BRANCH" \
    --title 'chore: actualizar bandos' \
    --body '## Actualización automática de bandos

Esta PR contiene los bandos nuevos o modificados descargados del RSS oficial de Bandomovil.

El sincronizador esperará los checks obligatorios y fusionará la PR solo cuando estén verdes.

_Generada por scripts/sync-bandos-cron.sh._')"
  PR_NUMBER="${PR_URL##*/}"
  echo "Pull Request creada: $PR_URL"
fi

wait_for_required_checks() {
  local attempts=0
  local max_attempts="${BANDOS_CHECK_DISCOVERY_ATTEMPTS:-60}"
  local interval_seconds="${BANDOS_CHECK_DISCOVERY_INTERVAL_SECONDS:-10}"
  local required_contexts=''
  local head_sha=''
  local check_runs=''
  local evaluation=''

  required_contexts="$("$GH_BIN" api \
    "repos/$REPOSITORY/branches/main/protection/required_status_checks/contexts")"

  while (( attempts < max_attempts )); do
    head_sha="$("$GH_BIN" pr view "$PR_NUMBER" --json headRefOid --jq '.headRefOid')"
    check_runs="$("$GH_BIN" api \
      "repos/$REPOSITORY/commits/$head_sha/check-runs?per_page=100")"
    evaluation="$(printf '{"required":%s,"checks":%s}' "$required_contexts" "$check_runs" | "$PNPM_BIN" exec tsx --eval '
      import fs from "node:fs";
      import { evaluateRequiredChecks } from "./scripts/bandos-sync-policy.ts";

      const payload = JSON.parse(fs.readFileSync(0, "utf8"));
      const result = evaluateRequiredChecks(payload.required, payload.checks.check_runs);
      if (result.failed.length > 0) process.stdout.write("failed");
      else if (result.missing.length > 0 || result.pending.length > 0)
        process.stdout.write("waiting");
      else process.stdout.write("ready");
    ')"

    case "$evaluation" in
      ready)
        return 0
        ;;
      failed)
        echo "Un check obligatorio ha fallado para $head_sha; no se fusiona la PR." >&2
        return 1
        ;;
      waiting)
        attempts=$((attempts + 1))
        echo "Esperando checks obligatorios para $head_sha: intento $attempts/$max_attempts; próximo intento en ${interval_seconds}s."
        sleep "$interval_seconds"
        ;;
      *)
        echo 'No se pudo interpretar el estado de los checks obligatorios.' >&2
        return 1
        ;;
    esac
  done

  return 1
}

PHASE='espera de checks obligatorios de la Pull Request'
if ! wait_for_required_checks; then
  echo 'Los checks obligatorios no han terminado correctamente dentro del tiempo de espera.' >&2
  exit 1
fi

PHASE='fusión de la Pull Request'
"$GH_BIN" pr merge "$PR_NUMBER" --merge --delete-branch
MERGE_COMMIT="$("$GH_BIN" pr view "$PR_NUMBER" --json state,mergeCommit --jq 'if .state == "MERGED" and .mergeCommit then .mergeCommit.oid else "" end')"
if [[ ! "$MERGE_COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
  echo 'GitHub no confirmó el SHA del merge.' >&2
  exit 1
fi

echo "Pull Request fusionada: $MERGE_COMMIT"

PHASE='realineación local de main tras la fusión'
/usr/bin/git fetch origin main
"$PNPM_BIN" exec tsx scripts/ensure-main-synced.ts
if [[ "$(/usr/bin/git rev-list --left-right --count main...origin/main)" != $'0\t0' ]]; then
  echo 'main local no ha quedado alineada con origin/main.' >&2
  exit 1
fi

PHASE='notificación de la sincronización'
if ! "$PNPM_BIN" exec tsx scripts/notify-bando-sync.ts "$MERGE_COMMIT"; then
  echo "Aviso de sincronización no enviado; la PR sí quedó fusionada en $MERGE_COMMIT." >&2
fi

PHASE='reconciliación de main hacia develop'
"$PNPM_BIN" exec tsx scripts/sync-main-to-develop.ts

echo "Sincronización de bandos completada y main integrada en develop (${MERGE_COMMIT})."
