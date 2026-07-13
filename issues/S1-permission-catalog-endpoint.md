# S1 — Permission catalog endpoint

Source PRD: `docs/prd-rbac-v2.md`

## What to build

Centralize the full permission catalog as the single backend source of truth, adding the new keys `costs.view`, `dashboard.access`, and `dashboard.analytics.view` alongside the existing module CRUD keys. Expose `GET /permissions` returning the complete catalog grouped by module, so the role-editor and any client can render every toggle without hardcoding a list that drifts from the backend.

## Acceptance criteria

- [ ] The catalog constant includes every module's `view/create/edit/delete`, plus `costs.view`, `dashboard.access`, `dashboard.analytics.view`.
- [ ] `GET /permissions` returns all catalog keys grouped by module.
- [ ] The endpoint is the single authoritative list — no other module redefines the set of possible keys.
- [ ] Adding a new key to the catalog surfaces in the endpoint response without further wiring.

## Blocked by

- S0
