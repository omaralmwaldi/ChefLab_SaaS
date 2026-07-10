# Auto-SKU Generator for Ingredients, Categories, and Recipes

## What to build

Add an Auto / Manual toggle to the SKU field on all three create modals (Ingredients, Categories, Recipes). When Auto is selected (the default), the modal fetches the next available SKU from the server and pre-fills the field. The field stays editable so users can override before submitting. Switching to Manual clears the field. Edit forms are unchanged.

Auto-generated format: `SK-0001`, `SK-0002`, … — independent counter per entity per organization.

Each entity gets a new read-only endpoint (`GET /<entity>/next-sku`) that computes the next SKU by scanning existing SKUs for the organization, finding the max, and incrementing. No schema migrations or new tables.

The feature is considered complete when a user can open any of the three create modals, see a pre-filled SKU, optionally edit it, and submit — and each entity's counter increments independently.

## Acceptance criteria

- [ ] `GET /ingredients/next-sku` returns `{ sku: "SK-XXXX" }` for the authenticated org
- [ ] `GET /categories/next-sku` same, independent counter
- [ ] `GET /recipes/next-sku` same, independent counter
- [ ] All three endpoints require JWT auth and return 401 without token
- [ ] Ingredient create modal defaults to Auto mode and pre-fills SKU on open
- [ ] Category create modal defaults to Auto mode and pre-fills SKU on open
- [ ] Recipe create modal defaults to Auto mode and pre-fills SKU on open
- [ ] Auto / Manual toggle visible on create modals only (not edit)
- [ ] Switching to Manual clears the SKU field; switching back to Auto re-fetches
- [ ] If next-sku fetch fails, modal falls back to Manual mode silently (empty editable field)
- [ ] User can edit the pre-filled SKU before submitting
- [ ] Submitting a duplicate SKU still returns 409 "SKU already exists" (existing behaviour)
- [ ] Opening ingredient create after one auto-SKU submit shows `SK-0002`
- [ ] Opening category create after one auto-SKU submit shows `SK-0002` (not affected by ingredient counter)

## Blocked by

None — can start immediately.
