# Recipe Filter — Backend authors endpoint

## Parent

PRD: Recipe List Filter Modal (`docs/prd-recipe-filter-modal.md`)

## What to build

A new endpoint that returns the distinct set of users who have authored at least one recipe in the
caller's organization, used to populate the filter modal's "created by" dropdown so it only ever lists
real authors.

`GET /recipes/authors`, guarded by the same `recipes.view` permission as the list, mounted before the
`/:id` route so it is not captured as an id. Returns `{ id, name }` per author, ordered by name.
Authors are the distinct `createdBy` values across the org's recipes; users deleted after authoring
simply do not appear (no matching user row).

## Acceptance criteria

- [ ] `GET /recipes/authors` returns the distinct authors of the calling org's recipes as `{ id, name }`
- [ ] Results are ordered by name
- [ ] Authors from other organizations are never returned
- [ ] A user who authored recipes but was later deleted does not appear
- [ ] The route requires `recipes.view` and resolves without being shadowed by `GET /recipes/:id`
- [ ] An org with no recipes returns an empty list

## Blocked by

- None - can start immediately
