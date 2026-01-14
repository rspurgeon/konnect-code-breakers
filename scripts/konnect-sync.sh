#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

log_cmd() {
  printf '+'
  for arg in "$@"; do
    printf ' %q' "$arg"
  done
  printf '\n'
}

run_cmd() {
  if [[ "${KONNECT_DEBUG:-}" == "true" || "${KONNECT_DEBUG:-}" == "1" ]]; then
    log_cmd "$@"
  fi
  "$@"
}

require_cmd kongctl
require_cmd deck
if [[ -z "${KONNECT_TOKEN:-}" ]]; then
  echo "KONNECT_TOKEN is required." >&2
  exit 1
fi

if [[ -z "${KONNECT_REGION:-}" ]]; then
  echo "KONNECT_REGION is required (for example: us, eu, au)." >&2
  exit 1
fi

base_files=(
  "${ROOT_DIR}/konnect/control-planes.yaml"
  "${ROOT_DIR}/konnect/auth-strategies.yaml"
  "${ROOT_DIR}/konnect/portals.yaml"
  "${ROOT_DIR}/konnect/apis.yaml"
)

post_files=(
  "${ROOT_DIR}/konnect/api-implementations.yaml"
)

kongctl_common_args=()
if [[ "${KONNECT_AUTO_APPROVE:-true}" == "true" ]]; then
  kongctl_common_args+=("--auto-approve")
fi
kongctl_common_args+=("--base-dir" "$ROOT_DIR")

CONTROL_PLANE_NAME="${CONTROL_PLANE_NAME:-code-breakers}"
KONGCTL_DEFAULT_KONNECT_PAT="${KONGCTL_DEFAULT_KONNECT_PAT:-$KONNECT_TOKEN}"
KONGCTL_DEFAULT_KONNECT_REGION="${KONGCTL_DEFAULT_KONNECT_REGION:-$KONNECT_REGION}"
DECK_KONNECT_TOKEN="${DECK_KONNECT_TOKEN:-$KONNECT_TOKEN}"
DECK_KONNECT_ADDR="${DECK_KONNECT_ADDR:-https://${KONNECT_REGION}.api.konghq.com}"
export KONGCTL_DEFAULT_KONNECT_PAT
export KONGCTL_DEFAULT_KONNECT_REGION
export DECK_KONNECT_TOKEN
export DECK_KONNECT_ADDR

base_args=()
for file in "${base_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing config file: $file" >&2
    exit 1
  fi
  base_args+=("-f" "$file")
done

#####################################################################
# STEP 1 kongctl sync the core resources
printf '==> Step 1: kongctl sync (base Konnect resources)\n'
run_cmd kongctl sync "${kongctl_common_args[@]}" "${base_args[@]}"
#####################################################################

#####################################################################
# Step 2 deck convert spec to Kong Gateway configuration and sync
printf '==> Step 2: deck sync (gateway config from OpenAPI)\n'
tmp_state=$(mktemp)
trap 'rm -f "$tmp_state"' EXIT

run_cmd deck file openapi2kong -s "${ROOT_DIR}/openapi.yaml" -o "$tmp_state" ${DECK_OPENAPI2KONG_FLAGS:-}

run_cmd deck gateway sync --konnect-control-plane-name "$CONTROL_PLANE_NAME" "$tmp_state" ${DECK_SYNC_FLAGS:-}
#####################################################################

#####################################################################
# STEP 3 kongctl sync any Kong Gateway dependent resources, like  API Implementations
printf '==> Step 3: kongctl sync (post-gateway resources)\n'
post_deck_args=()
for file in "${post_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Missing config file: $file" >&2
    exit 1
  fi
  post_deck_args+=("-f" "$file")
done

run_cmd kongctl sync "${kongctl_common_args[@]}" "${base_args[@]}" "${post_deck_args[@]}"
#####################################################################
