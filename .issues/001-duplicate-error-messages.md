# Duplicate error messages for recipe ingredients and SKUs

## What to build

Add clear, actionable error responses for two uniqueness violations that currently return a generic 500:

1. **Duplicate ingredient in a recipe** — when the same ingredient appears more than once in a recipe's ingredient array (create or update), reject the request before touching the database and return `400 { message: "Duplicate ingredient in recipe" }`.

2. **Duplicate SKU** — when an ingredient, recipe, or recipe category is created or updated with a SKU that already exists in the same organization, return `409 { message: "SKU already exists" }`. This applies identically to all three entities — no special-casing.

The duplicate-ingredient check mirrors the existing pre-DB check for duplicate sub-recipe links. The SKU conflict handling mirrors the existing `P2025 → 404` pattern: catch the Prisma `P2002` error in the service layer and re-throw a plain error; the controller maps it to the correct HTTP status.

No schema or migration changes are needed — the unique constraints already exist in the database.

## Acceptance criteria

- [ ] `POST /recipes` with the same `ingredientId` appearing twice returns `400 { "message": "Duplicate ingredient in recipe" }`
- [ ] `PUT /recipes/:id` with the same `ingredientId` appearing twice returns `400 { "message": "Duplicate ingredient in recipe" }`
- [ ] `POST /ingredients` with an already-used SKU returns `409 { "message": "SKU already exists" }`
- [ ] `PUT /ingredients/:id` updating SKU to an already-used value returns `409 { "message": "SKU already exists" }`
- [ ] `POST /recipes` with an already-used SKU returns `409 { "message": "SKU already exists" }`
- [ ] `PUT /recipes/:id` updating SKU to an already-used value returns `409 { "message": "SKU already exists" }`
- [ ] `POST /categories` with an already-used SKU returns `409 { "message": "SKU already exists" }`
- [ ] `PUT /categories/:id` updating SKU to an already-used value returns `409 { "message": "SKU already exists" }`
- [ ] A follow-up request with a unique SKU after a conflict succeeds with `201`/`200`
- [ ] No existing error paths (P2025 → 404, ZodError → 400, duplicate sub-recipe link → 400) are broken

## Blocked by

None — can start immediately.
