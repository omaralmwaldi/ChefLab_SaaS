# 07 — Restyle count cards (compact shadcn)

**Triage label:** ready-for-agent

## Parent

`docs/prd-dashboard-single-look-redesign.md`

## What to build

Re-render the recipe / user / ingredient count cards as compact shadcn cards with reduced padding so
they take less vertical space. Data and permission gating are unchanged — each card still appears only
when the user has the matching view permission, and the grid still adapts to how many cards are shown.

## Acceptance criteria

- [ ] The three count cards render as shadcn cards in brand colours
- [ ] Padding/height reduced versus the current cards
- [ ] Each card still shows only with its matching view permission (recipes/users/ingredients)
- [ ] Grid still adapts to 1 / 2 / 3 visible cards
- [ ] Counts match the fetched data
- [ ] Lint passes; manual verification per PRD passes

## Blocked by

- 04 — shadcn setup + brand palette
