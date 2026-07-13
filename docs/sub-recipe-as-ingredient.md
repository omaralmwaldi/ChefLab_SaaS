# PRD: Sub-recipe as Ingredient

## Problem Statement

A chef authoring a recipe often needs to compose it from reusable bases (sauces, stocks, doughs, marinades) that are themselves fully defined recipes in the system. Today every component of a recipe must be a raw `Ingredient` (e.g., "tomato", "olive oil"). This forces chefs to either:

- Flatten a base into its raw ingredients in every parent recipe (duplication, drift, lost cost fidelity when the base is re-tuned), or
- Maintain the base only in their head and reference it by name as a placeholder (no cost rollup, no link, no traceability).

The result is that high-value intermediate recipes (the "bases" that make a kitchen's output distinctive) can't be reused as first-class components. Cost reporting is wrong on the parent recipes that compose them, and edits to the base don't propagate.

## Solution

Allow a `Recipe` to reference another `Recipe` as a component (a "sub-recipe link"), in addition to existing `Ingredient` references. The link is a row in the same `RecipeIngredient` table that already holds ingredient lines, with a new `subRecipeId` foreign key. A line is either an ingredient link or a sub-recipe link — never both, never neither.

The server is the source of truth for the line's `usageUnit` and `usageUnitCost`. For an ingredient line, the client provides them as today. For a sub-recipe line, the client provides only `subRecipeId` and `quantity`; the server copies `yieldUnit` from the sub-recipe into `usageUnit` and computes `usageUnitCost = subRecipe.totalCost / subRecipe.yieldQuantity` at link time. The computed values are persisted as a snapshot, so parent recipes do not re-price when the sub-recipe is later edited.

Cycles are prevented at write time (service layer). The `yieldUnit` of any recipe that is referenced as a sub-recipe by other recipes is locked against edits, so the unit promise a parent recipe was built on cannot silently drift.

The result: a chef can build a `Sauce` recipe once, link it into `Pasta A`, `Pasta B`, and `Grain Bowl` with a single sub-recipe line each, see the rolled-up cost in every parent, and trust that the parent's cost is a frozen snapshot of the sub-recipe at the moment of linking.

## User Stories

1. As a chef, I want to add a sub-recipe as a line in a new recipe, so that I can compose a final dish from a base I have already defined.
2. As a chef, I want to add a sub-recipe as a line in an existing recipe, so that I can extend a recipe with a new base without rewriting the whole ingredient list.
3. As a chef, I want to remove a sub-recipe line from a recipe, so that I can rework the composition.
4. As a chef, I want to keep both ingredient lines and sub-recipe lines in the same recipe, so that I can mix raw ingredients and bases freely.
5. As a chef, I want the server to derive the sub-recipe line's `usageUnit` from the sub-recipe's `yieldUnit`, so that the unit is always consistent with what the sub-recipe actually outputs.
6. As a chef, I want the server to compute the sub-recipe line's `usageUnitCost` from the sub-recipe's `totalCost` and `yieldQuantity`, so that the parent recipe rolls up the sub-recipe's cost correctly.
7. As a chef, I want the computed `usageUnit` and `usageUnitCost` to be a snapshot on the parent recipe, so that editing the sub-recipe later does not silently re-price my parent recipes.
8. As a chef, I want a sub-recipe line to be impossible to express in the API without a valid `subRecipeId`, so that I cannot create an orphan line.
9. As a chef, I want a sub-recipe line to be impossible to express with `usageUnit` or `usageUnitCost` from the client, so that the server remains the single source of truth for those values.
10. As a chef, I want the system to prevent a recipe from linking to itself as a sub-recipe, so that I cannot create an obvious cycle.
11. As a chef, I want the system to prevent a chain of sub-recipe links from forming a cycle (A → B → A), so that cost computation cannot recurse infinitely.
12. As a chef, I want the system to detect cycles at the moment of writing the link, so that I get a clear error rather than a deferred cost-computation failure.
13. As a chef, I want the system to reject a recipe update that includes two sub-recipe lines pointing to the same sub-recipe, so that a recipe cannot accidentally double-count the same base.
14. As a chef, I want the system to reject an attempt to change `yieldUnit` on a recipe that is already used as a sub-recipe by other recipes, so that parent recipes built on the old unit cannot silently mismatch.
15. As a chef, I want to be free to change `yieldQuantity` on a recipe that is used as a sub-recipe, so that I can re-batch the base without first detaching every parent.
16. As a chef, I want the response for a recipe to include the linked sub-recipe's `id`, `sku`, `nameAr`, `nameEn`, and `yieldUnit` on each sub-recipe line, so that the UI can render a clickable link to the sub-recipe.
17. As a chef, I want the response for a recipe to keep the existing `ingredient` summary on each ingredient line, so that the existing UI continues to work unchanged.
18. As a chef, I want the sub-recipe line to participate in the parent recipe's `totalCost` rollup, so that the recipe cost view is complete and accurate.
19. As a chef, I want the sub-recipe line to participate in the parent recipe's `costPerStorageUnit` derivation, so that the per-storage-unit cost view is also accurate.
20. As a chef, I want the system to enforce multi-tenant isolation on sub-recipe links, so that I cannot reach a sub-recipe that belongs to a different organization by guessing its ID.
21. As a chef, I want the system to reject deletion of a sub-recipe that is still referenced as a sub-recipe by other recipes, so that I cannot strand parent recipes with missing components.
22. As a chef, I want a clear error message on every rejected write (cycle, duplicate, unit lock, tenant violation), so that I understand what to fix without reading server code.
23. As a chef, I want the API to keep the existing `usageUnit` / `usageUnitCost` semantics for ingredient lines, so that my existing recipes and clients continue to work.
24. As a chef, I want the sub-recipe link to follow the same partial-update convention as ingredient lines (array presence = wholesale replace), so that my mental model is consistent.
25. As a frontend developer, I want a single unified picker for recipe lines that searches across both `Ingredient` and `Recipe` by name and SKU, so that the chef has one workflow for picking a component.
26. As a frontend developer, I want the response to include both `ingredient` and `subRecipe` summary fields on each line (only one populated, never both), so that the renderer can branch on presence.
27. As a frontend developer, I want the server to derive `usageUnit` for a sub-recipe line, so that I don't need to know or display the sub-recipe's `yieldUnit` on the line edit form.
28. As an operations engineer, I want the cost snapshot to live in the `RecipeIngredient` row itself, so that historical recipes keep their original cost even when ingredients or sub-recipes are re-priced.
29. As an operations engineer, I want the cycle check to walk the parent chain via batched Prisma queries with a depth cap, so that the protection is cheap and total.
30. As an operations engineer, I want the new `subRecipeId` column to be nullable with a CHECK constraint enforcing "exactly one of ingredientId/subRecipeId", so that the invariant is enforced at the database level as a backstop to the application logic.

## Implementation Decisions

- **Module touched:** the `recipes` module only (controller, service, helpers, constants, validation). No changes to `ingredients`, `categories`, `roles`, or `auth` modules.
- **Schema:** `RecipeIngredient.subRecipeId` becomes a nullable `Uuid` foreign key to `Recipe`. A second `Recipe ↔ RecipeIngredient` back-relation (`SubRecipeLink`) is added to distinguish it from the existing `ingredients` back-relation. `ingredientId` is made nullable. `onDelete: Restrict` is set on the sub-recipe relation, matching the existing default for the `ingredient` relation and preventing accidental cascade. A DB-level `CHECK` constraint enforces "exactly one of `ingredient_id` / `sub_recipe_id` is set"; Prisma cannot model CHECK on Postgres, so the constraint is added via raw SQL in the migration.
- **Uniqueness:** a new `@@unique([recipeId, subRecipeId])` is added. Postgres treats NULLs as distinct in unique indexes by default, so multiple NULL `subRecipeId` rows are permitted per recipe (this is the desired behaviour: a recipe can have many ingredient-only lines). The app-level validation enforces "exactly one set" via the Zod union, with the CHECK constraint as a backstop.
- **Validation contract:** the `recipeIngredient` Zod schema becomes a `z.union` of two strict object schemas (no discriminator). The ingredient branch requires `ingredientId`, `quantity`, `usageUnit`, `usageUnitCost`. The sub-recipe branch requires only `subRecipeId` and `quantity`. Both branches use `.strict()` to reject unknown keys, so a client cannot smuggle `usageUnit` / `usageUnitCost` into a sub-recipe line, nor `subRecipeId` into an ingredient line.
- **Server-derived values:** for a sub-recipe line, the server sets `usageUnit = subRecipe.yieldUnit` (verbatim copy) and `usageUnitCost = subRecipe.totalCost / subRecipe.yieldQuantity` (Decimal math via `Prisma.Decimal.dividedBy` to avoid float drift). The value is stored in `RecipeIngredient.usageUnitCost` as a snapshot at link time.
- **Cycle prevention — create:** the service partitions the inbound `ingredients` array into ingredient lines and sub-recipe lines. On create, a duplicate-`subRecipeId`-in-payload check is run (the unique constraint would also catch this, but the app gives a clearer error). New recipes have no id yet and cannot be part of any existing chain, so a deeper check is not needed.
- **Cycle prevention — update:** for every `subRecipeId` in the new payload, the service performs an iterative BFS walk of the parent chain via `prisma.recipeIngredient.findMany({ where: { subRecipeId: { in: frontier } } })`. The walk stops if it reaches the recipe id being updated (cycle → 400) or if it exceeds depth 50 (defensive cap → 400). A `visited` set prevents re-walking the same sub-tree.
- **Tenant ownership:** the existing `assertTenantOwnership` helper is extended to also verify every `subRecipeId` belongs to the same `organizationId` via a single `prisma.recipe.findMany` with the same `id IN (...)` + `organizationId` filter used for ingredients and roles. The sub-recipe fetch is reused for the cost and unit derivation, so the same query serves both purposes.
- **`yieldUnit` lock:** when `updateRecipe` is called with `yieldUnit` in the payload, the service pre-fetches the current `yieldUnit` and checks whether any `RecipeIngredient` row elsewhere has `subRecipeId = id`. If so, and the new value differs from the current value, the update is rejected with a 400 explaining that the recipe must be detached from all sub-recipe links before `yieldUnit` can be edited. `yieldQuantity` is intentionally not locked — re-batching a base is permitted, and the cost snapshot absorbs the resulting cost drift.
- **Cost snapshot semantics preserved:** the existing invariant "`RecipeIngredient.usageUnitCost` is a snapshot, never re-derived from the live `Ingredient.costPerStorageUnit`" is extended to sub-recipe lines. The snapshot is taken at link time from `subRecipe.totalCost / subRecipe.yieldQuantity` and is never recomputed, even if the sub-recipe's ingredients or yield change later.
- **Response shape:** `RECIPE_INCLUDE` gains a `subRecipe: { select: { id, sku, nameAr, nameEn, yieldUnit } }` summary on every `RecipeIngredient` line, alongside the existing `ingredient` summary. The sub-recipe summary intentionally does not include nested ingredients or steps to keep responses bounded.
- **API stability:** controller signatures, route paths, and HTTP semantics are unchanged. The only client-visible changes are: (a) sub-recipe lines may appear in the response with a populated `subRecipe` field, and (b) the `ingredients` request array may now contain sub-recipe-shaped objects.
- **No controller-level changes:** all new errors are plain `Error` instances thrown from helpers, caught by the controller's existing handler and mapped to 400 with the message — matching the pattern used for the existing duplicate-step-order check.
- **Frontend contract (for the consumer of this PRD):** the line editor will use a single unified search picker that returns either `Ingredient` or `Recipe` results, and the form will hide the `usageUnit` / `usageUnitCost` fields whenever the picked result is a sub-recipe. This is documented as an API contract: sub-recipe lines in the request must not carry `usageUnit` or `usageUnitCost` and will be rejected if they do.

## Testing Decisions

- **Test external behaviour only:** assertions go through the HTTP layer (`POST /recipes`, `PATCH /recipes/:id`, `GET /recipes/:id`, `DELETE /recipes/:id`). Internal helpers (`partitionLines`, `assertNoSubRecipeCycle`, `assertSubRecipeYieldUnitEditable`, `computeSubRecipeUsageUnitCost`) are not unit-tested in isolation — they are exercised through the endpoints. The only internal exception is the Decimal-math helper, which gets a small direct check that a non-zero `yieldQuantity` produces a non-zero `usageUnitCost` and a zero `yieldQuantity` throws.
- **Highest seam: the HTTP endpoint.** No new test harness is introduced. If a test runner already exists, tests are added there. If not, manual end-to-end verification via `curl` is the bar.
- **Test scenarios (must cover all of these):**
  - **Happy path — create with sub-recipe:** create Y with two ingredients, create X with one sub-recipe line pointing to Y, `GET /recipes/:X` returns the line with a populated `subRecipe.id === Y.id`, `usageUnit === Y.yieldUnit`, `usageUnitCost` equal to `Y.totalCost / Y.yieldQuantity` rounded to 4 decimal places, and X's `totalCost` includes the sub-recipe line.
  - **Happy path — update with sub-recipe:** create A and B; `PATCH /recipes/:A` with `ingredients: [{ subRecipeId: B.id, quantity: 1 }]` succeeds; `GET /recipes/:A` shows the link.
  - **Mixed lines:** a recipe can contain both ingredient lines (client-supplied) and sub-recipe lines (server-derived) in the same `ingredients` array.
  - **Server-derive enforcement — extra keys rejected:** `POST /recipes` with a sub-recipe line that also carries `usageUnit: "kg"` or `usageUnitCost: 999` returns 400. `POST /recipes` with an ingredient line that also carries `subRecipeId` returns 400.
  - **Snapshot holds:** after linking Y into X, update Y's ingredients to halve its cost. `GET /recipes/:X` shows the original `usageUnitCost` on the sub-recipe line and the original X `totalCost`. No recompute.
  - **Direct self-link rejected:** `POST /recipes` with `subRecipeId` equal to the new recipe's own id is impossible (no id at create time) but `PATCH /recipes/:A` with `ingredients: [{ subRecipeId: A.id }]` returns 400 with a cycle message.
  - **Two-step cycle rejected:** create A, B; `PATCH /recipes/:A` to include B as sub-recipe (ok); `PATCH /recipes/:B` to include A as sub-recipe (400, "Sub-recipe link would create a cycle").
  - **Three-step cycle rejected:** A → B → C as sub-recipes, then attempting C → A is rejected.
  - **Duplicate sub-recipe in payload rejected:** `POST /recipes` with two lines both pointing to the same Y returns 400 with a duplicate message.
  - **`yieldUnit` lock enforced:** with Y referenced as a sub-recipe of X, `PATCH /recipes/:Y` with a different `yieldUnit` returns 400 with a clear reason; `PATCH /recipes/:Y` with the same `yieldUnit` is allowed; `PATCH /recipes/:Y` with a new `yieldQuantity` is allowed; after detaching Y from X, `PATCH /recipes/:Y` with a new `yieldUnit` is allowed again.
  - **Tenant isolation:** org A creates Y; org B's authenticated user tries to `POST /recipes` with `subRecipeId: Y.id` and gets 400 ("sub-recipe not found or access denied"); org B trying to `GET /recipes/:Y` of org A's Y also fails.
  - **Delete rejected when referenced:** `DELETE /recipes/:Y` while Y is a sub-recipe of X returns 400 (FK `Restrict`); after detaching Y from X, the delete succeeds.
  - **Existing endpoint regression:** a recipe with only ingredient lines (no sub-recipe lines) round-trips through create / get / update with byte-identical behaviour to before; `usageUnit` and `usageUnitCost` come from the client as today; `ingredient` summary is present and `subRecipe` summary is `null` on the response.
  - **Migration on existing data:** running the migration on a seeded DB that already contains `RecipeIngredient` rows succeeds — all existing rows have `ingredient_id IS NOT NULL`, the CHECK constraint accepts them, no data backfill is required.
- **Prior art for the tests:** there is no existing automated test suite for the backend. The convention in `CLAUDE.md` is "no test script". The verification bar for this PRD is therefore manual end-to-end via `curl` against `npm run dev`, mirroring the existing development workflow.

## Out of Scope

- **UI implementation.** The unified picker, sub-recipe line rendering, and click-through navigation to the parent sub-recipe are not part of this PRD. The API contract is defined; the frontend work follows.
- **Cycle detection on ingredient links.** A recipe cannot currently include itself via an ingredient (no `parentRecipe` concept on `Ingredient`). This PRD only addresses sub-recipe cycles.
- **Cascading cost invalidation.** When a sub-recipe's ingredients are edited, the parent's `usageUnitCost` is intentionally NOT recomputed. No tooling is provided to "re-price" historical parents.
- **Snapshot audit fields.** A `linkedAt` timestamp or "snapshot date" is not added to `RecipeIngredient`. The snapshot is implicit in the row.
- **Bulk operations.** No endpoint to mass-link or mass-detach sub-recipes. Chefs use the existing array-replace semantics.
- **Conversion of sub-recipe units.** If a chef wants 200g of a sub-recipe that yields 1 kg, the convention is to add a `conversionFactor` on the sub-recipe itself, not to do live conversion on the parent's line. This PRD does not introduce runtime unit conversion.
- **Yield-unit change workflow.** Unlinking all parents before changing `yieldUnit` is a manual operation. No "rename and propagate" tool is provided.
- **Search ranking or relevance.** The unified picker (frontend) is out of scope; the API exposes the lookup primitives (existing `GET /recipes`, `GET /ingredients`) the picker will compose.
- **Authorization beyond tenant ownership.** Role-based access control (RBAC) for "who can link a sub-recipe" is out of scope; the existing `permission.middleware.js` is empty per `CLAUDE.md` known gaps.

## Further Notes

- The `yieldUnit` lock and the cost snapshot together preserve a strict invariant for any parent recipe built on a sub-recipe: the unit it consumes and the per-unit cost it pays are both frozen at link time. This is the same trust model the system already provides for raw `Ingredient` lines.
- The cycle protection is intentionally implemented in the service layer, not via a recursive CTE trigger, to keep the failure mode testable from `curl` and the error message human-readable. A depth-50 BFS covers any realistic recipe composition.
- The DB-level CHECK constraint is the safety net: even if a future code path forgets the Zod XOR, the database will reject orphan or double-set rows.
- The Decimal arithmetic uses `Prisma.Decimal` for the snapshot computation, not JavaScript `Number`, to avoid the float drift that would otherwise creep in when dividing `totalCost` by `yieldQuantity` and rounding to 4 dp.
- A follow-up PRD will likely cover: (a) the frontend unified picker and sub-recipe line editor, (b) optional `linkedAt` / `snapshotVersion` audit fields on `RecipeIngredient`, and (c) a "re-price" workflow for users who explicitly want to roll sub-recipe edits forward into historical parents.
