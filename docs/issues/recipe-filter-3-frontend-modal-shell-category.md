# Recipe Filter — Frontend modal shell + category (tracer)

## Parent

PRD: Recipe List Filter Modal (`docs/prd-recipe-filter-modal.md`)

## What to build

The end-to-end frontend tracer for the filter feature: everything the later filter dimensions plug
into, proven with the category dimension.

- A **Filter** button on the recipe list toolbar, showing a badge with the count of active filters.
- A filter modal (styled to match the existing recipe modal) with **Apply**, **Reset**, and **Cancel**
  controls. Apply assembles the current criteria and triggers a single refetch; Reset clears all
  fields; Cancel closes without applying. Applied filters persist while browsing until reset.
- Swap the list page from its direct list call to the recipes API client, extended to send filter
  parameters (multi-value dimensions sent comma-separated per the backend contract).
- The **category** filter as a multi-select, loaded from the existing `/categories` endpoint, wired
  through to the backend so choosing categories narrows the list.
- New labels added to both the English and Arabic `recipes` translation namespaces.
- An empty filtered result is communicated clearly (distinct from an error/loading state).

## Acceptance criteria

- [ ] A Filter button appears on the recipe list and opens the modal
- [ ] The button shows a badge with the number of active filters (0 = no badge)
- [ ] Selecting one or more categories and pressing Apply refetches and narrows the list
- [ ] Reset clears the category selection and returns the full list
- [ ] Cancel closes the modal without changing the applied filters
- [ ] Applied filters persist when navigating to a recipe and back
- [ ] An empty result reads as "no matches", not as an error
- [ ] All new labels are localized in English and Arabic
- [ ] Filtering works unchanged for a user without cost-view permission

## Blocked by

- Recipe Filter — Backend list filter params
