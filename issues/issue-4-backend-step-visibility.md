# Backend-enforced recipe step visibility

**Label:** ready-for-agent
**Source PRD:** `docs/prd-rbac-refinements.md`

## What to build

Move recipe step visibility from a frontend-only filter into the backend read path, so the API never returns steps a user may not see, and so the owner (who holds no role) sees everything.

End-to-end behavior:

- Step filtering is applied in the recipe read path (service layer) on **both** the single-recipe detail and the recipe list — visibility does not depend on which screen opened it.
- A step is visible to the requester when the requester is the **owner**, OR holds **`recipes.edit`**, OR the step has a `RecipeStepRole` whose `roleId` equals the requester's `roleId`. All other steps are absent from the response entirely, not merely hidden.
- The read path receives the request context it needs (requester's `roleId`, owner status, edit capability) resolved through the existing owner/permission helpers.
- The frontend step filter becomes redundant; the UI trusts the server response.

## Acceptance criteria

- [ ] The owner receives every step of a recipe on both list and detail.
- [ ] A user with `recipes.edit` receives every step on both list and detail.
- [ ] A role-scoped viewer without `recipes.edit` receives only steps assigned to their role; steps for other roles are absent from the API payload.
- [ ] Filtering is consistent between the recipe list and the recipe detail responses.
- [ ] The frontend renders steps directly from the server response without re-filtering by role.
- [ ] Behavior is covered by HTTP-seam tests using the harness from slice 1.

## User stories covered

PRD stories 29, 30, 31, 32, 33.

## Blocked by

- Slice 1 (Permission catalog collapse + migration + test harness) — needs the test harness.
