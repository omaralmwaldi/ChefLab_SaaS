# Recipe Filter — Frontend status + shelf-life-place controls

## Parent

PRD: Recipe List Filter Modal (`docs/prd-recipe-filter-modal.md`)

## What to build

Add two more filter controls to the modal:

- **Status** — single-select (Draft / Closed / any). Sends `status`.
- **Shelf-life place** — multi-select over the `ShelfLifePlace` enum (Room Temperature / Chiller / Freezer),
  matching any selected place. Sends `shelfLifePlace` comma-separated.

Both wire into the existing Apply / Reset / badge machinery. Enum option labels reuse the existing
shelf-life and status translation keys.

## Acceptance criteria

- [ ] Status single-select narrows the list to the chosen status on Apply
- [ ] Shelf-life-place multi-select returns recipes matching any selected place
- [ ] Both combine with the other filters (AND)
- [ ] Status (when set) and each selected shelf-life place count toward the active-filter badge
- [ ] Reset clears both controls
- [ ] Option labels are localized in English and Arabic

## Blocked by

- Recipe Filter — Frontend modal shell + category (tracer)
