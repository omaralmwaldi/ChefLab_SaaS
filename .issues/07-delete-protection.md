---
title: "Delete protection for recipes used as sub-recipes"
triage: ready-for-agent
slice: 7
parent: PRD-sub-recipe-as-ingredient
blocked_by: [2]
---

## What to build

Prevent deletion of a recipe Y when any other recipe has Y in its lines as a sub-recipe. Deleting Y while it is referenced would strand parent recipes with dangling `sub_recipe_id` foreign keys; the same hazard exists today for `Ingredient` rows referenced by recipes and is handled by the Prisma default behaviour (the relation has no cascade, so delete throws).

This slice does not introduce a new application-level check. It relies on the `onDelete: Restrict` declared in slice 1 on the `RecipeIngredient.subRecipe` relation. The Prisma `recipe.delete` call in the existing service will surface a foreign-key violation, which the controller's error handler maps to a 400 with a clear message. The verification is end-to-end: confirm the FK constraint fires, the service catches and rethrows with a friendly message, and the chef is told to detach Y from its parents first.

If the existing `deleteRecipe` service does not currently catch Prisma FK errors, this slice adds the catch and maps the error to a 400 with a message that names the field and the resolution step.

## Acceptance criteria

- [ ] `DELETE /recipes/:Y` returns 400 with a clear "recipe is used as a sub-recipe" message while Y is referenced as a sub-recipe by any other recipe.
- [ ] After detaching Y from every parent (via `PATCH /recipes/:X` with an `ingredients` array that omits the Y link), `DELETE /recipes/:Y` succeeds and returns 204.
- [ ] Deleting a recipe that is not referenced as a sub-recipe continues to work as it does today (regression check).
- [ ] The service catches the Prisma FK violation (error code `P2003` or equivalent from the underlying driver) and rethrows a plain `Error` with a message that names the field and the resolution step; the controller maps it to 400.
- [ ] The `RecipeIngredient` rows that referenced Y are NOT cascade-deleted (the relation is `Restrict`, not `Cascade`); they remain in the database after the failed delete attempt, with their `sub_recipe_id` still pointing at Y.
- [ ] The recipe deletion path does not require any application-level "is this recipe referenced?" pre-check — the DB constraint is the single source of truth for the rule.

## Blocked by

- 02-sub-recipe-creation-and-validation
