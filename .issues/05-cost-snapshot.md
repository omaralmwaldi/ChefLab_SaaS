---
title: "Cost snapshot holds after sub-recipe edits"
triage: ready-for-agent
slice: 5
parent: PRD-sub-recipe-as-ingredient
blocked_by: [2]
---

## What to build

Verify and lock the cost-snapshot invariant for sub-recipe links. When a parent recipe X links a sub-recipe Y, the sub-recipe line on X stores `usageUnitCost` computed from Y's `totalCost / yieldQuantity` at the moment of the link. This value must never be recomputed when Y is later edited — historical parents keep their original cost.

This slice is mostly a behaviour test against the data path established in slice 2, with one verification: a `PATCH /recipes/:Y` that changes Y's own ingredients (and therefore Y's `totalCost`) must not change X's `totalCost` or any of X's sub-recipe line `usageUnitCost` values on the next `GET /recipes/:X`. The same invariant already holds for ingredient lines (existing behaviour); this slice adds the assertion for the sub-recipe path.

## Acceptance criteria

- [ ] Create Y with two ingredients totalling a known cost (e.g., 10.00). Create X linking Y with `quantity: 2`. X's `totalCost` includes a line cost of `2 × (10.00 / Y.yieldQuantity)`.
- [ ] `PATCH /recipes/:Y` to halve Y's ingredient cost. `GET /recipes/:X` returns the original `usageUnitCost` and `totalCost` unchanged.
- [ ] `PATCH /recipes/:Y` to change Y's `yieldQuantity`. `GET /recipes/:X` returns the original `usageUnitCost` and `totalCost` unchanged.
- [ ] A second parent X2 created after Y's cost change picks up the new cost — confirming the snapshot is per-link, not per-recipe.
- [ ] The `usageUnitCost` column on `RecipeIngredient` is the only source of cost for the line; no live re-derivation from `Recipe.totalCost` happens at read time.
- [ ] `GET /recipes/:Y` after the edit shows the new (lower) `totalCost` for Y — confirming Y itself is re-priced while parents are not.
- [ ] The same snapshot property is verified for ingredient lines (regression check, no code change required — already enforced by the existing service).

## Blocked by

- 02-sub-recipe-creation-and-validation
