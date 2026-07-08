---
title: "Sub-recipe link — schema migration"
triage: ready-for-agent
slice: 1
parent: PRD-sub-recipe-as-ingredient
blocked_by: []
---

## What to build

Add the database support for sub-recipe links to `RecipeIngredient`. The migration makes the new `subRecipeId` column available to the service layer, with a DB-level CHECK constraint enforcing "exactly one of `ingredient_id` / `sub_recipe_id` is set" as a backstop to application-level validation. Existing data must not be affected.

Concretely:
- Make `RecipeIngredient.ingredientId` nullable.
- Add `RecipeIngredient.subRecipeId` as a nullable Uuid foreign key to `Recipe`, with `onDelete: Restrict`.
- Add a `Recipe ↔ RecipeIngredient` back-relation named distinctly from the existing `ingredients` back-relation.
- Add `@@unique([recipeId, subRecipeId])`.
- Add a raw-SQL `CHECK` constraint in the migration: `(ingredient_id IS NOT NULL AND sub_recipe_id IS NULL) OR (ingredient_id IS NULL AND sub_recipe_id IS NOT NULL)`.
- Confirm the migration runs on a seeded DB without data backfill.

## Acceptance criteria

- [ ] `prisma migrate dev` generates a migration that runs cleanly on a DB with existing `RecipeIngredient` rows (all with `ingredient_id IS NOT NULL`).
- [ ] `RecipeIngredient` schema has `subRecipeId: String? @db.Uuid`, nullable, with a foreign-key relation to `Recipe` and `onDelete: Restrict`.
- [ ] `RecipeIngredient.ingredientId` is nullable in the schema and the generated migration.
- [ ] A second back-relation is added on `Recipe` (e.g., named `subRecipeOfLinks`) so the parent-side and sub-recipe-side relations are unambiguous.
- [ ] `@@unique([recipeId, subRecipeId])` is declared in the Prisma model and present in the generated migration.
- [ ] The migration contains a raw SQL statement adding the CHECK constraint with a clear constraint name (e.g., `recipe_ingredient_xor_check`).
- [ ] Manually inserting a `RecipeIngredient` row with both `ingredient_id` and `sub_recipe_id` set is rejected by the DB.
- [ ] Manually inserting a row with neither set is rejected by the DB.
- [ ] No service, controller, or validation code is modified in this slice.
- [ ] `npx prisma generate` succeeds and the generated client exposes the new field and relation.

## Blocked by

None - can start immediately.
