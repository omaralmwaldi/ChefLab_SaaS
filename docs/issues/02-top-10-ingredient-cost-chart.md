# Top-10 ingredient cost chart with storage-unit filter

## What to build

Add a dashboard chart ranking the top-10 ingredients by cost per storage unit. Include all
ingredients but drop any whose cost is null (returned that way for users lacking cost-view
permission). Add a storage-unit filter above the chart whose options are the distinct storage units
present in the ingredients (sorted) plus an "All" option; selecting a unit narrows and re-ranks the
chart. Show an empty-state message when no ingredient matches. Titles, filter label, and options are
localized in English and Arabic with correct right-to-left layout. Widget stays behind the existing
dashboard analytics-view permission gate. Costs shown in SAR.

Frontend-only: the ingredient list endpoint already returns `storageUnit` and `costPerStorageUnit`.

## Acceptance criteria

- [ ] Chart shows up to 10 ingredients ranked descending by cost per storage unit.
- [ ] Ingredients with null cost are excluded.
- [ ] Storage-unit dropdown lists only units present in ingredients, plus "All" (default).
- [ ] Changing the dropdown re-ranks the chart to that unit's top-10; "All" shows global top-10.
- [ ] Empty state message shows when no ingredient matches the selection.
- [ ] Titles, filter label, and options are translated (EN + AR) and render correctly in RTL.
- [ ] Widget is hidden for users without the analytics-view permission.
- [ ] `npm run lint` passes.

## Blocked by

None - can start immediately.
