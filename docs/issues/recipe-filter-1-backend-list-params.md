# Recipe Filter — Backend list filter params

## Parent

PRD: Recipe List Filter Modal (`docs/prd-recipe-filter-modal.md`)

## What to build

Extend the recipe list endpoint (`GET /recipes`) so it can filter by every dimension the filter modal
will need. All filters combine with AND and stay scoped to the caller's `organizationId` from the JWT.

Parameters:

- `q` — case-insensitive substring match on `nameEn` OR `nameAr`. **Contract change:** `q` no longer
  matches SKU (it previously matched name and SKU together). The recipe list is the only consumer.
- `sku` — new parameter, case-insensitive substring match on `sku`.
- `categoryId` — accepts multiple values, translated to an `IN` match.
- `shelfLifeUnit` — new parameter, accepts multiple values, `IN` match against the `ShelfLifeUnit`
  enum (`HOUR`, `DAY`, `WEEK`, `MONTH`).
- `status` — single value, equality match (existing behavior preserved).
- `createdBy` — new parameter, single user id, equality match.

Multi-value parameters (`categoryId`, `shelfLifeUnit`) arrive as a single comma-separated string and
are split into an array in the controller; the service normalizes single/array/comma inputs
defensively. This avoids bracket-notation ambiguity against Express 5's read-only `req.query`.

No parameters returns the full organization list unchanged (regression guard on the `q` change).

## Acceptance criteria

- [ ] `q` matches recipes by English or Arabic name (case-insensitive) and no longer matches by SKU
- [ ] `sku` matches recipes by SKU substring, independently of `q`
- [ ] `categoryId` accepts multiple comma-separated ids and returns recipes in any of them
- [ ] `shelfLifeUnit` accepts multiple values and returns recipes with any of the listed units
- [ ] `status` and `createdBy` each narrow the list by equality
- [ ] Multiple parameters combine with AND
- [ ] Every filter stays scoped to the caller's organization; recipes from other orgs are never returned
- [ ] No parameters returns the full org list (unchanged from today)
- [ ] Cost-visibility serialization behaves exactly as before under every filter combination

## Blocked by

- None - can start immediately
