---
title: "yieldUnit lock when recipe is referenced as a sub-recipe"
triage: ready-for-agent
slice: 4
parent: PRD-sub-recipe-as-ingredient
blocked_by: [2]
---

## What to build

Lock the `yieldUnit` field of any recipe that is currently used as a sub-recipe by another recipe. The lock exists because every parent recipe's sub-recipe line has its `usageUnit` set from the sub-recipe's `yieldUnit` at link time; if `yieldUnit` is changed after the fact, the parent's line silently drifts into a unit the chef never agreed to.

The rule applies only to `yieldUnit`. `yieldQuantity` is intentionally not locked: re-batching a base is a normal kitchen operation, and the cost snapshot on the parent's line absorbs any resulting cost drift.

Implementation: when `updateRecipe` is invoked with `yieldUnit` in the payload, the service runs a pre-check before applying the update. It fetches the current `yieldUnit` (single-row query, same `organizationId` scope) and checks whether any `RecipeIngredient` row in the tenant has `subRecipeId = id`. If so, and the new value differs from the current value, the update is rejected with a 400 carrying a clear reason ("Cannot change yieldUnit: this recipe is used as a sub-recipe in other recipes. Detach the sub-recipe links before editing yieldUnit."). Edits with the same value are allowed (no-op write).

## Acceptance criteria

- [ ] `PATCH /recipes/:Y` with a new `yieldUnit` returns 400 with a clear reason while Y is referenced as a sub-recipe by any other recipe.
- [ ] `PATCH /recipes/:Y` with the same `yieldUnit` value as currently stored succeeds (no-op, but should not 400).
- [ ] `PATCH /recipes/:Y` with a new `yieldQuantity` (and no `yieldUnit` change) succeeds regardless of whether Y is referenced as a sub-recipe.
- [ ] `PATCH /recipes/:Y` with a change to `nameEn` or any other non-yield field succeeds regardless of whether Y is referenced.
- [ ] After detaching Y from every parent (by sending a new `ingredients` array that omits the Y link in each parent), `PATCH /recipes/:Y` with a new `yieldUnit` succeeds.
- [ ] The pre-check query is a single `findFirst` on `recipe_ingredients` by `sub_recipe_id` — no full-table scan.
- [ ] The pre-check runs only when `yieldUnit` is in the payload; an update that omits `yieldUnit` does not incur the extra query.
- [ ] The 400 response message names the field (`yieldUnit`) and tells the chef how to resolve the conflict (detach first).

## Blocked by

- 02-sub-recipe-creation-and-validation
