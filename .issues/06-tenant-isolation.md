---
title: "Multi-tenant isolation on sub-recipe IDs"
triage: ready-for-agent
slice: 6
parent: PRD-sub-recipe-as-ingredient
blocked_by: [2]
---

## What to build

Confirm and lock the multi-tenant boundary for sub-recipe links. A user authenticated as organization A must not be able to reach organization B's recipes by guessing their IDs in a sub-recipe link, and the `GET /recipes/:id` response must not leak a foreign-tenant sub-recipe's data through a parent's `subRecipe` summary.

Two enforcement points:
- **Write path:** the existing `assertTenantOwnership` helper (extended in slice 2 to accept `subRecipeIds`) verifies that every `subRecipeId` in a `POST /recipes` or `PATCH /recipes/:id` payload belongs to the same `organizationId` decoded from the JWT. A cross-tenant ID produces a 400 with a "not found or access denied" message — the same shape used for ingredient and role tenant checks.
- **Read path:** the `subRecipe` summary returned on each `RecipeIngredient` line is fetched via a Prisma `include` that joins on `Recipe`, which is itself scoped by `organizationId` in the parent `findFirst` / `findMany` call. The existing pattern already prevents cross-tenant reads; this slice adds the verification.

## Acceptance criteria

- [ ] Create a recipe Y in organization A. Authenticate as a user in organization B. `POST /recipes` with `ingredients: [{ subRecipeId: Y.id, quantity: 1 }]` returns 400 with a "not found or access denied" message; no recipe is created in B.
- [ ] `PATCH /recipes/:X` in organization B with `ingredients: [{ subRecipeId: Y.id, quantity: 1 }]` (where Y belongs to A) returns 400 with the same message; X is unchanged in B.
- [ ] A `GET /recipes/:X` call in organization A that has a legitimate sub-recipe link returns the sub-recipe summary; a `GET /recipes/:X` call in organization B for any recipe id (existing or not) returns 404, never leaking A's data.
- [ ] The `subRecipe` summary returned in a `GET /recipes/:X` response (within A) projects only `id, sku, nameAr, nameEn, yieldUnit` — no nested ingredients, no steps, no other recipes' data.
- [ ] The tenant check uses one batched `prisma.recipe.findMany({ where: { id: { in: subRecipeIds }, organizationId } })` call, not per-ID fetches.
- [ ] A user with a valid JWT for organization A cannot use a sub-recipe ID that exists in A but is archived / soft-deleted (if such a state exists) — the helper returns 400.
- [ ] No 500 errors are exposed in any of the above paths; every rejection is a clean 400 with a JSON error body.

## Blocked by

- 02-sub-recipe-creation-and-validation
