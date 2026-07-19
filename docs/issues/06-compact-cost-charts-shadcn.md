# 06 — Compact both cost charts via shadcn chart wrapper

**Triage label:** ready-for-agent

## Parent

`docs/prd-dashboard-single-look-redesign.md`

## What to build

Re-render the two existing cost charts (top-10 recipe cost, top-10 ingredient cost) through the
shadcn chart wrapper at a reduced height (~220px) so they fit a single-look layout. Data, scoping,
sorting, cap-at-10, empty states, and per-chart storage-unit filters are unchanged. Each chart keeps
its own independent filter — no shared/global filter. This slice is presentation-only.

## Acceptance criteria

- [ ] Both charts render through the shadcn chart wrapper at ~220px height
- [ ] Recipe chart still: CLOSED only, filtered by its own unit selector, sorted desc, top 10
- [ ] Ingredient chart still: null-cost dropped, filtered by its own unit selector, sorted desc, top 10
- [ ] Each chart's filter narrows only that chart; no shared filter introduced
- [ ] Empty states still render when a filter matches nothing
- [ ] Right-to-left tick/margin handling preserved in Arabic
- [ ] SAR formatting and brand colours preserved
- [ ] Lint passes; manual verification per PRD passes

## Blocked by

- 04 — shadcn setup + brand palette
