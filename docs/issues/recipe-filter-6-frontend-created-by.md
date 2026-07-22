# Recipe Filter — Frontend created-by dropdown

## Parent

PRD: Recipe List Filter Modal (`docs/prd-recipe-filter-modal.md`)

## What to build

Add a **Created by** single-select dropdown to the filter modal, populated from the authors endpoint
so it lists only users who have actually authored a recipe. Selecting an author sends `createdBy` and
narrows the list to that author's recipes. Includes an "any author" default. Wires into the existing
Apply / Reset / badge machinery. Labels localized in English and Arabic.

## Acceptance criteria

- [ ] The dropdown loads its options from `GET /recipes/authors`
- [ ] Only real recipe authors appear; there is an "any author" default that applies no filter
- [ ] Selecting an author narrows the list to that author's recipes on Apply
- [ ] Created-by combines with the other filters (AND)
- [ ] A selected author counts toward the active-filter badge
- [ ] Reset clears the selection back to "any author"
- [ ] Labels are localized in English and Arabic

## Blocked by

- Recipe Filter — Frontend modal shell + category (tracer)
- Recipe Filter — Backend authors endpoint
