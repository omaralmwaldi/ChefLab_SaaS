---
title: "Sub-recipe cycle prevention"
triage: ready-for-agent
slice: 3
parent: PRD-sub-recipe-as-ingredient
blocked_by: [2]
---

## What to build

Prevent any sub-recipe link from creating a cycle in the recipe graph. A cycle would make cost computation recurse infinitely. Two write paths need protection:

- **Create path (`POST /recipes`):** the new recipe has no id yet, so it cannot appear in any existing parent chain. The only cycle risk is two sub-recipe lines in the same payload pointing to the same sub-recipe. Reject that case with a 400 carrying a "duplicate sub-recipe link" message. (The `@@unique([recipeId, subRecipeId])` constraint would also reject it, but the app gives a clearer message.)
- **Update path (`PATCH /recipes/:id`):** the recipe being updated has an id and may already be in a parent chain. Before persisting the new `ingredients` array, walk the parent chain upward from each new `subRecipeId` using an iterative BFS over `prisma.recipeIngredient.findMany({ where: { subRecipeId: { in: frontier } } })`. If the walk reaches the id of the recipe being updated, reject with 400 carrying a "Sub-recipe link would create a cycle" message. Cap the walk at depth 50 as a defensive bound; if the cap is hit without resolving, reject with a "chain exceeds maximum depth" message.

## Acceptance criteria

- [ ] A duplicate `subRecipeId` in the same `POST /recipes` payload returns 400 with a duplicate message; no `Recipe` row is created.
- [ ] `PATCH /recipes/:A` with `ingredients: [{ subRecipeId: A.id, quantity: 1 }]` (self-link) returns 400 with a cycle message; A is unchanged.
- [ ] With A linking B, `PATCH /recipes/:B` with `ingredients: [{ subRecipeId: A.id, quantity: 1 }]` returns 400 with a cycle message.
- [ ] With A → B → C as sub-recipe links, `PATCH /recipes/:C` with `ingredients: [{ subRecipeId: A.id, quantity: 1 }]` returns 400.
- [ ] A valid 3-deep chain A → B → C → D (where D is freshly created and links no one) is accepted on `POST /recipes` and on `PATCH /recipes/:D`.
- [ ] An attempted 51-deep chain is rejected with a "maximum depth" message.
- [ ] The BFS walk does not revisit the same sub-tree (a `visited` set prevents quadratic blow-up on a wide but shallow graph).
- [ ] The BFS walk queries `recipe_ingredients` filtered by `sub_recipe_id IN (...)` and selects only `recipe_id`, keeping each step cheap.
- [ ] Cycle protection runs only when the `ingredients` array is present in the payload (omitted array = no change, no cycle check).
- [ ] Existing recipes that link no sub-recipes continue to update with no observable change in behaviour.

## Blocked by

- 02-sub-recipe-creation-and-validation
