# Shared chrome translated (delete confirm, pagination, uploader, badges, shelf-life labels)

## What to build

Replace all hardcoded strings in the following shared components with `t()` calls using the `common` namespace:

- `DeleteConfirm.jsx` — confirmation prompt text, confirm and cancel button labels
- `Pagination.jsx` — "Previous" and "Next" button labels
- `StepMediaUploader.jsx` — upload progress messages and error text

Additionally, translate inline string literals on the recipe list and detail pages:
- Status badge labels: "Draft", "Closed" (and any other status values)
- Shelf life unit labels: "Hour", "Day", "Week", "Month"
- Storage place labels: "Room Temperature", "Chiller", "Freezer"

## Acceptance criteria

- [ ] Delete confirmation dialog text and buttons render in the selected language
- [ ] Pagination "Previous" / "Next" labels render in the selected language
- [ ] StepMediaUploader upload progress and error messages render in the selected language
- [ ] Status badge labels (Draft, Closed) render in the selected language on recipe list and detail pages
- [ ] Shelf life unit labels (Hour, Day, Week, Month) render in the selected language on recipe detail pages
- [ ] Storage place labels (Room Temperature, Chiller, Freezer) render in the selected language
- [ ] No hardcoded English strings remain in `DeleteConfirm.jsx`, `Pagination.jsx`, or `StepMediaUploader.jsx`

## Blocked by

- [#0002 i18n foundation + RTL + `LanguageSwitcher` wiring](./0002-i18n-foundation-rtl-language-switcher.md)
