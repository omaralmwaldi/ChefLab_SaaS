# S2 — Cost permission enforcement (serializer + write-guard)

Source PRD: `docs/prd-rbac-v2.md`

## What to build

Enforce the single system-wide `costs.view` permission on the data itself. When a caller lacks `costs.view` (and is not the owner), omit — not `403` — all cost figures from responses: `totalCost` and every recipe-ingredient `usageUnitCost` on recipe responses, and `costPerStorageUnit` plus `usageUnitCost` on ingredient responses. The embedded recipe-ingredient cost inside a recipe is governed by this same permission. On recipe and ingredient updates by a caller lacking `costs.view`, ignore any incoming cost fields and preserve the stored values, so a cost-blind edit never nulls or alters pricing (the guard protects the stored `usageUnitCost` inputs from which recipe cost is derived).

## Acceptance criteria

- [ ] With `costs.view`, recipe and ingredient responses include all cost fields.
- [ ] Without `costs.view` (non-owner), `totalCost`, `usageUnitCost`, and `costPerStorageUnit` are absent from responses — the fields are omitted, not zeroed, and no `403` is returned.
- [ ] The owner always receives cost fields.
- [ ] A user without `costs.view` updating a recipe or ingredient leaves stored cost values unchanged, verifiable by re-reading as an owner or cost-permitted user.
- [ ] Cost stripping applies to embedded recipe-ingredient costs within recipe responses.

## Blocked by

- S0
