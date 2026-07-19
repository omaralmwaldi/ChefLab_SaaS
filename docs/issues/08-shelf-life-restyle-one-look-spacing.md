# 08 — Shelf-life card restyle + one-look spacing

**Triage label:** ready-for-agent

## Parent

`docs/prd-dashboard-single-look-redesign.md`

## What to build

Re-render the recipes-per-shelf-life-place breakdown in shadcn style (compact badges/rows), unchanged
in data (all recipes grouped across ROOM_TEMPERATURE / CHILLER / FREEZER). Then tighten the overall
dashboard spacing so hero + count cards + both compacted charts + shelf-life card read as roughly one
screen on a typical desktop viewport. This is the final one-look pass; best done once slices 05–07
have landed so the layout is tuned against the real widgets.

## Acceptance criteria

- [ ] Shelf-life breakdown renders in shadcn style (compact badges/rows), brand colours
- [ ] Counts still group all recipes across the three fixed shelf-life places and match the data
- [ ] Inter-section spacing tightened so the dashboard reads ~one screen on a typical desktop viewport
- [ ] EN + AR labels and right-to-left layout correct
- [ ] No widget from slices 05–07 is visually broken by the spacing changes
- [ ] Lint passes; manual verification per PRD passes

## Blocked by

- 04 — shadcn setup + brand palette

Soft dependency: best sequenced after 05, 06, 07 so the one-look spacing is tuned against the final widgets.
