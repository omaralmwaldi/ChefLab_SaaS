# Recipes-per-shelf-life-place card

## What to build

Add a dashboard card that counts recipes grouped by shelf-life place across the three fixed buckets:
room temperature, chiller, and freezer. Count ALL recipes regardless of status (structural
distribution, not a cost metric). Render as a compact stat card / small breakdown, one line per place
showing the localized place label and its count. Place labels are localized in English and Arabic
with correct right-to-left layout. Card stays behind the existing dashboard analytics-view permission
gate.

Frontend-only: the recipe list endpoint already returns `shelfLifePlace`.

## Acceptance criteria

- [ ] Card shows a count for each of ROOM_TEMPERATURE, CHILLER, and FREEZER.
- [ ] Counts include all recipes (DRAFT and CLOSED).
- [ ] The three counts sum to the total recipe count.
- [ ] Place labels are translated (EN + AR) and render correctly in RTL.
- [ ] Card is hidden for users without the analytics-view permission.
- [ ] `npm run lint` passes.

## Blocked by

None - can start immediately.
