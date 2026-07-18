# S4 — Server-side recipe step visibility

Source PRD: `docs/prd-rbac-refinements.md`

## What to build

Move recipe-step filtering out of the frontend and into the recipe read path (service layer), so the API never returns steps a user may not see, and so the owner (who holds no role) sees everything.

Visibility rule: a step is visible to the requester when the requester is the **owner**, OR holds **recipes.edit**, OR the step has a `RecipeStepRole` whose `roleId` equals the requester's `roleId`. Apply the filter on both the single-recipe read and the recipe list — visibility must not depend on which screen opened it. The read path receives request context (requester `roleId`, owner status, edit capability) resolved via the existing owner/permission helpers. The now-redundant frontend step filter is removed so the client trusts the server response.

## Acceptance criteria

- [ ] The owner receives every step of every recipe from both list and detail endpoints.
- [ ] A `recipes.edit` holder receives all steps of a recipe from both endpoints.
- [ ] A role-scoped user (no `recipes.edit`) receives only the steps whose `RecipeStepRole.roleId` matches their role, from both list and detail — other roles' steps are absent from the response body, not merely hidden.
- [ ] Filtering is identical across the recipe list and the recipe detail.
- [ ] The frontend no longer filters steps locally and renders exactly what the server returns.

## Blocked by

- None — can start immediately.
