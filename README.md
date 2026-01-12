# konnect-code-breakers

Codebreakers is a small, Mastermind-style API used to demonstrate how Kong Konnect
resources are managed declaratively. This repository shows how to coordinate
`kongctl` (Konnect resources) and `decK` (gateway configuration) in an automated
workflow using a single OpenAPI specification as the source of truth.

## What this repo demonstrates

- Declarative Konnect resources: control plane, portal, API, API versions, and docs.
- Gateway configuration generated from `openapi.yaml` using `deck openapi2kong`.
- A simple, repeatable sync flow that stitches `kongctl` and `decK` together.

## Repository layout

- `openapi.yaml`: source of truth for the Codebreakers API.
- `konnect/`: Konnect declarative config.
  - `konnect/control-planes.yaml`: creates the control plane (`code-breakers`).
  - `konnect/portals.yaml`: portal definition and pages.
  - `konnect/apis.yaml`: API, versions, documents, and portal publication.
  - `konnect/auth-strategies.yaml`: application auth strategies (key auth).
  - `konnect/apis/codebreakers/docs/`: API documentation content.
- `scripts/konnect-sync.sh`: orchestration script for `kongctl` + `decK`.
- `docs/`: implementation plan and background notes.

## Automation flow (local or CI)

The recommended flow is:

1. `kongctl sync` base Konnect resources (control plane, portal, API, docs).
2. `deck openapi2kong` + `deck sync` to the control plane.
3. `kongctl sync` remaining resources that depend on gateway objects (planned).

### Environment variables

- `KONNECT_TOKEN`: Konnect personal access token.
- `KONNECT_REGION`: Konnect region short code (e.g., `us`, `eu`, `au`).
- `CONTROL_PLANE_NAME`: optional override (default: `code-breakers`).

### Example

```
KONNECT_TOKEN=... KONNECT_REGION=us ./scripts/konnect-sync.sh
```
