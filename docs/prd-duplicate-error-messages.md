# PRD: Duplicate Error Messages

## Problem Statement

When a user submits a recipe with the same ingredient listed twice, or tries to create/update an ingredient, recipe, or recipe category with a SKU that already exists in their organization, the API returns a generic 500 Internal Server Error. The real cause — a database uniqueness violation — is never surfaced to the client. Frontend editors and API consumers cannot distinguish this from a true server fault, so they cannot show a meaningful error to the end user.

## Solution

The API should catch both uniqueness violations at the right layer and return explicit, human-readable error responses:

1. **Duplicate ingredient in a recipe** — when the same `ingredientId` appears more than once in the `ingredients` array of a create or update request, return `400 Bad Request` with `{ message: "Duplicate ingredient in recipe" }` before the database is touched.
2. **Duplicate SKU** — when an ingredient, recipe, or recipe category is created or updated with a SKU that already exists within the same organization, return `409 Conflict` with `{ message: "SKU already exists" }`.

## User Stories

1. As a recipe editor, I want a clear error when I accidentally add the same ingredient twice to a recipe, so that I can fix my input without guessing why the save failed.
2. As a recipe editor, I want the duplicate-ingredient error to appear immediately on submit, so that I do not have to wait for a slow database round-trip before seeing feedback.
3. As a recipe editor, I want a clear error when I create a recipe with a SKU that already exists in my organization, so that I know to choose a different SKU.
4. As a recipe editor, I want a clear error when I update a recipe's SKU to one that is already taken, so that I can pick a unique value.
5. As a kitchen manager, I want a clear error when I create an ingredient with a duplicate SKU, so that I know the ingredient already exists under that code.
6. As a kitchen manager, I want a clear error when I update an ingredient's SKU to a conflicting value, so that I can resolve the conflict deliberately.
7. As a kitchen manager, I want a clear error when I create a recipe category with a SKU that is already in use, so that I can keep the catalog SKU namespace clean.
8. As a kitchen manager, I want a clear error when I update a recipe category's SKU to a duplicate, so that the rename is blocked until I choose a unique value.
9. As a frontend developer integrating with this API, I want duplicate-ingredient errors to return HTTP 400, so that my form validation layer treats them the same as other input errors.
10. As a frontend developer integrating with this API, I want duplicate-SKU errors to return HTTP 409, so that my UI can distinguish "conflict with existing data" from "malformed request" and display the right copy.
11. As a frontend developer, I want the error body to always be `{ message: "..." }` (not a Zod `{ errors: [...] }` shape), so that I can use a single error handler for conflict responses.
12. As a developer consuming the API, I want duplicate-SKU checks to be consistent across ingredients, recipes, and categories, so that there is one predictable behavior to document and test.

## Implementation Decisions

- **Duplicate ingredient detection runs pre-database**, in the recipe service, before `prisma.recipe.create`/`prisma.recipe.update` is called. This mirrors the existing pattern used for duplicate sub-recipe links and avoids relying on a Prisma unique-constraint error for a check that can be expressed in application logic.
- **Duplicate SKU detection catches the Prisma `P2002` error code** in the service layer (create and update paths) and re-throws a plain `Error("SKU already exists")`. The controller maps this message to `409 Conflict`. This keeps the controller/service contract identical to the existing `P2025 → 404` pattern.
- **HTTP 400 for duplicate ingredient, HTTP 409 for duplicate SKU.** Duplicate ingredient is a malformed-input error (same data sent twice in one request). Duplicate SKU is a conflict with existing persisted state — semantically distinct, warranting the RFC 9110 `409 Conflict` status.
- **All three SKU-bearing models (Ingredient, Recipe, RecipeCategory) receive identical handling.** No module is special-cased. The same try/catch pattern is applied to `createIngredient`, `updateIngredient`, `createRecipe`, `updateRecipe`, `createCategory`, `updateCategory`.
- **Error message is the fixed string `"SKU already exists"`** — no SKU value embedded, no organization scope qualifier. Consistent with the existing `"Ingredient not found or access denied"` style (short, entity-agnostic).
- **No schema or migration changes required.** The `@@unique([organizationId, sku])` constraints already exist on all three models. This change only adds application-layer handling of the violation they produce.
- The existing `"Duplicate sub-recipe link"` error (already handled as 400 in the recipe controller) is not touched.
- Sub-recipe ingredient duplicate detection already exists; only regular ingredient (`ingredientId`) lines gain the new check.

## Testing Decisions

**What makes a good test here:** assert the HTTP response status code and the `message` field of the JSON body. Do not assert which internal function ran or how many database calls were made — those are implementation details. Tests should call the real running API.

**Testing seam:** HTTP API (single seam, highest possible). Tests `POST` and `PUT` to `/recipes`, `/ingredients`, and `/categories` with conflicting payloads and verify status + body.

**Modules tested:**

- `POST /recipes` — body with two lines sharing the same `ingredientId` → expect `400 { message: "Duplicate ingredient in recipe" }`
- `PUT /recipes/:id` — same payload on update → expect `400`
- `POST /ingredients` — SKU that already exists in the org → expect `409 { message: "SKU already exists" }`
- `PUT /ingredients/:id` — update SKU to an existing one → expect `409`
- `POST /recipes` — SKU conflict → expect `409`
- `PUT /recipes/:id` — SKU conflict on update → expect `409`
- `POST /categories` — SKU conflict → expect `409`
- `PUT /categories/:id` — SKU conflict → expect `409`
- Happy path after a previous conflict (same SKU, unique on retry) → expect `201`/`200`

**Prior art:** No existing test suite. These would be the first integration tests in the project. A simple HTTP client (e.g., `supertest` against the Express app) is the natural choice given the project already uses Express 5 and has no test runner configured.

## Out of Scope

- Adding duplicate-SKU handling to the bulk Excel import flow for ingredients. That path already has its own in-file SKU deduplication logic and row-level error reporting; it is a separate concern.
- Frontend display of these errors. The PRD covers the API contract only.
- Duplicate `nameEn` / `nameAr` uniqueness enforcement (not currently constrained at the DB level for all models).
- RBAC / permission middleware (already noted as a known gap).
- Duplicate `ingredientId` detection for sub-recipe lines — already handled by the existing `"Duplicate sub-recipe link"` check.

## Further Notes

- The `@@unique([recipeId, ingredientId])` and `@@unique([recipeId, subRecipeId])` constraints on `RecipeIngredient` serve as the database-level safety net even after the pre-DB check is added. The pre-DB check exists for a faster, cleaner response — not to replace the constraint.
- The `409` status code is the first of its kind in this codebase. Frontend integrations should be updated to handle it alongside the existing `400` and `404` error shapes.
