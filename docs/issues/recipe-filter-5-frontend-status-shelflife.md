# Recipe Filter — Frontend status + shelf-life-unit controls

## Parent

PRD: Recipe List Filter Modal (`docs/prd-recipe-filter-modal.md`)

## What to build

Add two more filter controls to the modal:

- **Status** — single-select (Draft / Closed / any). Sends `status`.
- **Shelf-life unit** — multi-select over the `ShelfLifeUnit` enum (Hour / Day / Week / Month), matching
  any selected unit. Sends `shelfLifeUnit` comma-separated.

Both wire into the existing Apply / Reset / badge machinery. Enum option labels reuse the existing
shelf-life and status translation keys.

## Acceptance criteria

- [ ] Status single-select narrows the list to the chosen status on Apply
- [ ] Shelf-life-unit multi-select returns recipes matching any selected unit
- [ ] Both combine with the other filters (AND)
- [ ] Status (when set) and each selected shelf-life unit count toward the active-filter badge
- [ ] Reset clears both controls
- [ ] Option labels are localized in English and Arabic

## Blocked by

- Recipe Filter — Frontend modal shell + category (tracer)
