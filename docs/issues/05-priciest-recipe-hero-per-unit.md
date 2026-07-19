# 05 — Priciest-recipe hero (per-unit) + unit selector

**Triage label:** ready-for-agent

## Parent

`docs/prd-dashboard-single-look-redesign.md`

## What to build

Add the headline hero metric to the top of the dashboard: the single most expensive CLOSED recipe
within a selected storage unit, shown large in SAR with its unit labelled. A small unit selector on
the hero switches the comparison basis and defaults to the first available unit. Ranking stays within
one unit so a per-kilo recipe is never ranked against a per-piece one, using the same
`costPerStorageUnit` basis as the existing charts. The widget sits behind the analytics permission
gate and is fully localized (EN + AR, right-to-left).

## Acceptance criteria

- [ ] Hero shows the top CLOSED recipe by `costPerStorageUnit` within the selected storage unit
- [ ] Cost renders large in SAR with the storage unit labelled
- [ ] Unit selector lists distinct CLOSED-recipe storage units (sorted) and defaults to the first
- [ ] Switching the unit re-selects the correct recipe and never shows another unit's recipe
- [ ] Empty state shows when the selected unit has no CLOSED recipes
- [ ] Hidden entirely when the user lacks analytics-view permission
- [ ] EN + AR labels present; right-to-left layout correct
- [ ] Built with shadcn primitives from slice 04; lint passes
- [ ] Manual verification per PRD passes (no automated test harness in this slice)

## Blocked by

- 04 — shadcn setup + brand palette
