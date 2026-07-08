---
title: "Frontend: Recipe Editor supports sub-recipe lines"
triage: ready-for-agent
slice: 8
parent: PRD-sub-recipe-as-ingredient
blocked_by: [2, 3, 4, 5, 6, 7]
---

## What to build

Extend the Recipe Editor in the frontend to support sub-recipe lines alongside the existing ingredient lines. The work is purely UI + client-side payload construction; the API contract is fixed by the backend slices.

The editor's "add a line" workflow becomes a single unified picker that searches across both `Ingredient` and `Recipe` by `nameEn`, `nameAr`, and `sku`, and lets the chef pick either type. When a sub-recipe is picked, the form shows only `quantity` — `usageUnit` and `usageUnitCost` are read-only fields (or hidden) populated from the server's response after the line is saved. When an ingredient is picked, the form shows `quantity`, `usageUnit`, and `usageUnitCost` as today.

The list of existing lines in the editor renders the sub-recipe line with a clickable link to the sub-recipe's own editor (using the `subRecipe.id` returned by the API). Ingredient lines continue to render as today. Each line shows a derived line cost (`quantity * usageUnitCost`) for at-a-glance comparison.

When editing a recipe that is itself used as a sub-recipe, the editor shows a non-blocking banner explaining that `yieldUnit` cannot be changed until the recipe is detached from its parents, and disables the `yieldUnit` field on the form. `yieldQuantity` remains editable.

## Acceptance criteria

- [ ] The "add a line" picker searches both `Ingredient` and `Recipe` in one input; the result list shows type and name for each hit.
- [ ] Picking an `Ingredient` from the unified picker results in a line whose request payload contains `ingredientId`, `quantity`, `usageUnit`, and `usageUnitCost`.
- [ ] Picking a `Recipe` (sub-recipe) from the unified picker results in a line whose request payload contains only `subRecipeId` and `quantity` — never `usageUnit`, `usageUnitCost`, or `ingredientId`.
- [ ] The form for a sub-recipe line hides the `usageUnit` and `usageUnitCost` inputs; the saved values from the server are shown read-only.
- [ ] The form for an ingredient line shows all three editable fields as today.
- [ ] Each line in the editor list shows the derived line cost (`quantity * usageUnitCost`) formatted to 2 decimal places.
- [ ] A sub-recipe line in the editor list shows the sub-recipe's name (resolved from the `subRecipe` summary) and a clickable link to open the sub-recipe in its own editor.
- [ ] When the editor detects (via a new GET response or a dedicated field) that the current recipe is used as a sub-recipe, the `yieldUnit` field is disabled and a banner explains why; `yieldQuantity` and all other fields remain editable.
- [ ] Mixed recipes (ingredient + sub-recipe lines in the same `ingredients` array) can be authored and saved.
- [ ] The 400 error responses from the backend (cycle, duplicate, unit lock, tenant violation, delete-protected) are surfaced to the chef in the form's error message area without reloading the page.
- [ ] No new dependency is added beyond what the frontend already uses (`react-router-dom`, `axios`).
- [ ] `npm run lint` and `npm run build` pass.

## Blocked by

- 02-sub-recipe-creation-and-validation
- 03-cycle-prevention
- 04-yieldunit-lock
- 05-cost-snapshot
- 06-tenant-isolation
- 07-delete-protection
