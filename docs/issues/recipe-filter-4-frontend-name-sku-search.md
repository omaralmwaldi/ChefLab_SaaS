# Recipe Filter — Frontend name + SKU search boxes

## Parent

PRD: Recipe List Filter Modal (`docs/prd-recipe-filter-modal.md`)

## What to build

Add two text search controls to the filter modal:

- A **bilingual name** search box that matches the English or Arabic recipe name (sends `q`).
- A separate **SKU** search box (sends `sku`).

Both feed into the same Apply / Reset / badge machinery built in the modal shell, and both count
toward the active-filter badge. Labels localized in English and Arabic.

## Acceptance criteria

- [ ] The name box narrows the list by English or Arabic name on Apply
- [ ] The SKU box narrows the list by SKU, independently of the name box
- [ ] Name and SKU combine with each other and with the category filter (AND)
- [ ] Each non-empty box counts toward the active-filter badge
- [ ] Reset clears both boxes
- [ ] Labels are localized in English and Arabic

## Blocked by

- Recipe Filter — Frontend modal shell + category (tracer)
