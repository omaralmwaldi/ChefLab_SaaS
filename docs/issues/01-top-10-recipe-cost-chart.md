# Top-10 recipe cost chart with storage-unit filter

## What to build

Replace the dashboard's existing top-5 "Recipe Cost Ranking" chart with a top-10 chart ranking
CLOSED recipes by cost per storage unit. Add a storage-unit filter above the chart whose options are
the distinct storage units present in the CLOSED recipes (sorted) plus an "All" option; selecting a
unit narrows and re-ranks the chart, "All" shows the global top-10. Show an empty-state message when
no recipe matches. All titles, the filter label, and options are localized in English and Arabic with
correct right-to-left layout. The whole widget stays behind the existing dashboard analytics-view
permission gate. Costs shown in SAR.

Frontend-only: the recipe list endpoint already returns `storageUnit`, `status`, and the derived
`costPerStorageUnit`, so no backend change is needed.

## Acceptance criteria

- [ ] Old top-5 total-cost recipe chart is removed.
- [ ] Chart shows up to 10 CLOSED recipes ranked descending by cost per storage unit.
- [ ] DRAFT recipes never appear in the chart.
- [ ] Storage-unit dropdown lists only units present in CLOSED recipes, plus "All" (default).
- [ ] Changing the dropdown re-ranks the chart to that unit's top-10; "All" shows global top-10.
- [ ] Empty state message shows when no recipe matches the selection.
- [ ] Titles, filter label, and options are translated (EN + AR) and render correctly in RTL.
- [ ] Widget is hidden for users without the analytics-view permission.
- [ ] `npm run lint` passes.

## Blocked by

None - can start immediately.
