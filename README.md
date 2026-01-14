# konnect-code-breakers

Codebreakers is a small, Mastermind-style API used to demonstrate how Kong Konnect
resources are managed declaratively. This repository shows how to coordinate
`kongctl` (Konnect resources) and `decK` (gateway configuration) in an automated
workflow using a single OpenAPI specification as the source of truth.

## What this repo demonstrates

- Declarative Konnect resources: control plane, portal, API, API versions, and docs.
- Gateway configuration generated from `openapi.yaml` using `deck openapi2kong`.
- A simple, repeatable sync flow that stitches `kongctl` and `decK` together.

## Why two tools (and why the order matters)

Konnect API Platform resources (control planes, portals, APIs, docs, and API implementations)
are managed by `kongctl`. Gateway core entities (services, routes, plugins, etc.) are managed
by `decK`. API Implementations in Konnect must reference an existing gateway service, so the
service must be created first.

Required sequence:

1. `kongctl sync` base Konnect resources (everything except API implementations).
2. `deck file openapi2kong` + `deck gateway sync` to create gateway services/routes in the control plane.
3. `kongctl sync` API implementations (now that the gateway service exists).

`decK` targets the control plane by name via `--konnect-control-plane-name`.

## Repository layout

- `openapi.yaml`: source of truth for the Codebreakers API.
- `konnect/`: Konnect declarative config.
  - `konnect/control-planes.yaml`: creates the control plane (`code-breakers`).
  - `konnect/portals.yaml`: portal definition and pages.
  - `konnect/apis.yaml`: API, versions, documents, and portal publication.
  - `konnect/api-implementations.yaml`: API Implementation resources (synced after gateway).
  - `konnect/auth-strategies.yaml`: application auth strategies (key auth).
  - `konnect/apis/codebreakers/docs/`: API documentation content.
- `scripts/konnect-sync.sh`: orchestration script for `kongctl` + `decK`.
- `docs/`: implementation plan and background notes.

## Automation flow (local or CI)

The recommended flow is:

1. `kongctl sync` base Konnect resources (control plane, portal, API, docs).
2. `deck file openapi2kong` + `deck gateway sync` to the control plane.
3. `kongctl sync` API implementations after gateway services exist.

### Environment variables

- `KONNECT_TOKEN`: Konnect personal access token (used by both tools).
- `KONNECT_REGION`: Konnect region short code (e.g., `us`, `eu`, `au`).
- `CONTROL_PLANE_NAME`: optional override (default: `code-breakers`).

The script maps `KONNECT_TOKEN` and `KONNECT_REGION` to tool-specific
environment variables (`KONGCTL_DEFAULT_KONNECT_PAT`,
`KONGCTL_DEFAULT_KONNECT_REGION`, `DECK_KONNECT_TOKEN`, `DECK_KONNECT_ADDR`),
and passes `CONTROL_PLANE_NAME` to `deck --konnect-control-plane-name`.
It also runs `kongctl sync` with `--base-dir` set to the repo root so `!file`
references like `../openapi.yaml` resolve correctly.

### Requirements

- `kongctl` and `deck` installed and available in your PATH.

### Example

```
KONNECT_TOKEN=... KONNECT_REGION=us ./scripts/konnect-sync.sh
```

## GitHub Actions

The workflow in `.github/workflows/konnect-sync.yml` runs on pushes to `main`
when `openapi.yaml` or `konnect/**` change. It installs the latest `kongctl`
and `deck`, then runs `./scripts/konnect-sync.sh`.

Set these repository secrets for CI:

- `KONNECT_TOKEN`
- `KONNECT_REGION`
