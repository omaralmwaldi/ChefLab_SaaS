---
title: "Sub-recipe line creation + strict validation"
triage: ready-for-agent
slice: 2
parent: PRD-sub-recipe-as-ingredient
blocked_by: [1]
---

## What to build

Wire the sub-recipe link end-to-end through the recipe service. The `POST /recipes` and `PATCH /recipes/:id` endpoints accept an `ingredients` array containing either ingredient lines (existing behaviour, client provides all four fields) or sub-recipe lines (new, client provides only `subRecipeId` and `quantity`). For sub-recipe lines, the server is the sole source of truth for `usageUnit` and `usageUnitCost`:
- `usageUnit` is copied verbatim from the sub-recipe's `yieldUnit`.
- `usageUnitCost` is computed as `subRecipe.totalCost / subRecipe.yieldQuantity` using `Prisma.Decimal` arithmetic to avoid float drift, and stored as a snapshot.

Validation is strict: a sub-recipe line carrying `usageUnit`, `usageUnitCost`, or `ingredientId` is rejected; an ingredient line carrying `subRecipeId` is rejected. The CHECK constraint from slice 1 is the DB-level backstop; the Zod union is the user-facing gate.

The response on `GET /recipes/:id` (and list endpoints) now includes a `subRecipe` summary on each line alongside the existing `ingredient` summary. The sub-recipe summary projects only `id`, `sku`, `nameAr`, `nameEn`, `yieldUnit` — never the nested ingredients or steps, to keep responses bounded.

## Acceptance criteria

- [ ] The recipe-line Zod schema is a `z.union` of two `.strict()` object schemas: ingredient branch (`ingredientId`, `quantity`, `usageUnit`, `usageUnitCost`) and sub-recipe branch (`subRecipeId`, `quantity` only).
- [ ] `POST /recipes` with a sub-recipe line stores a `RecipeIngredient` row whose `usageUnit` equals the referenced sub-recipe's `yieldUnit`.
- [ ] `POST /recipes` with a sub-recipe line stores a `usageUnitCost` equal to `subRecipe.totalCost / subRecipe.yieldQuantity` rounded to 4 decimal places, computed via `Prisma.Decimal.dividedBy`.
- [ ] `GET /recipes/:id` returns a `subRecipe: { id, sku, nameAr, nameEn, yieldUnit }` field on each sub-recipe line; the `ingredient` field on that same line is `null`.
- [ ] `GET /recipes/:id` continues to return the existing `ingredient` summary on ingredient-only lines; the `subRecipe` field is `null` on those lines.
- [ ] `PATCH /recipes/:id` with a new `ingredients` array that includes sub-recipe lines replaces all existing lines and stores the new ones with server-derived values, following the same partial-update convention as ingredient lines.
- [ ] `POST /recipes` with a sub-recipe line that also sends `usageUnit` returns 400 with a Zod "unrecognized key" message.
- [ ] `POST /recipes` with a sub-recipe line that also sends `usageUnitCost` returns 400.
- [ ] `POST /recipes` with an ingredient line that also sends `subRecipeId` returns 400.
- [ ] `POST /recipes` with a sub-recipe line where the referenced recipe does not exist returns 400 with a "sub-recipe not found" message.
- [ ] A recipe containing only ingredient lines round-trips through `POST` → `GET` with byte-identical behaviour to before this slice (regression check).
- [ ] `totalCost` and `costPerStorageUnit` of a recipe roll up correctly when the lines include a mix of ingredient and sub-recipe rows.

## Blocked by

- 01-schema-migration
