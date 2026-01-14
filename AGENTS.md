# AGENTS.md

## Purpose
This repository is a minimal example of managing Kong Konnect resources
declaratively for a small "Codebreakers" API (Mastermind-style game). It
demonstrates how to coordinate `kongctl` (Konnect resources) with `decK`
(Kong Gateway configuration) using a single OpenAPI spec.

## Key constraints
- `openapi.yaml` is the source of truth for the API.
- Do **not** commit generated `decK` gateway config; it is produced on the fly.
- Konnect declarative configs live under `konnect/`.
- `!file` references may include parent path traversal; keep existing references.
- Control plane name is `code-breakers` (used by default in automation).
- `scripts/konnect-sync.sh` expects `kongctl` and `deck` in PATH.

## Repository map
- `openapi.yaml`: API spec used by `deck openapi2kong`.
- `konnect/control-planes.yaml`: creates the control plane.
- `konnect/portals.yaml`: portal and pages.
- `konnect/apis.yaml`: API, versions, docs, and portal publication.
- `konnect/api-implementations.yaml`: API Implementation resources (synced after gateway).
- `konnect/auth-strategies.yaml`: key-auth strategy for portal publications.
- `konnect/apis/codebreakers/docs/`: API docs content.
- `scripts/konnect-sync.sh`: orchestration script for `kongctl` + `decK`.
- `docs/`: implementation plan and background material.

## Automation workflow
Current recommended sequence (see `scripts/konnect-sync.sh`):
1. `kongctl sync` base Konnect resources (control plane, portal, API, docs).
2. `deck file openapi2kong` -> `deck gateway sync` to the control plane.
3. `kongctl sync` API implementations after gateway services exist.

Required env vars:
- `KONNECT_TOKEN`: Konnect personal access token (used by both tools).
- `KONNECT_REGION`: short region code (`us`, `eu`, `au`, ...).
- Optional `CONTROL_PLANE_NAME` (default `code-breakers`).

`scripts/konnect-sync.sh` maps `KONNECT_TOKEN` and `KONNECT_REGION` to tool
environment variables (`KONGCTL_DEFAULT_KONNECT_PAT`,
`KONGCTL_DEFAULT_KONNECT_REGION`, `DECK_KONNECT_TOKEN`, `DECK_KONNECT_ADDR`),
and passes `CONTROL_PLANE_NAME` to `deck --konnect-control-plane-name`.
The script runs `kongctl sync` with `--base-dir` set to the repo root so `!file`
references can traverse to `../openapi.yaml`.

## Portal auth
Portal login is currently disabled in `konnect/portals.yaml`, but API
publications use the `key-auth` application strategy in `konnect/apis.yaml`.
