# Recipe create/edit forms translated

## What to build

Replace all hardcoded strings in `RecipeEditor.jsx` and `RecipeModal.jsx` with `t()` calls using the `recipes` namespace. Both `nameEn` and `nameAr` input fields must always be rendered (not toggled by language). Step fields must always show both `titleEn`/`titleAr` and `descriptionEn`/`descriptionAr` input pairs. Labels on all fields — including the bilingual pairs — must follow the selected application language via `t()`. Arabic `<input>` and `<textarea>` fields must retain explicit `dir="rtl"` regardless of document direction. Validation and inline error messages must render via `t()`.

## Acceptance criteria

- [ ] All form labels, placeholders, button text, and section headings in RecipeEditor and RecipeModal render in the selected language
- [ ] Both `nameEn` and `nameAr` fields are always visible regardless of selected language
- [ ] Step editors always show both `titleEn`/`titleAr` and `descriptionEn`/`descriptionAr` input pairs
- [ ] Labels on Arabic-specific fields (e.g. "Arabic Name") render in Arabic when app language is Arabic
- [ ] Arabic input fields carry `dir="rtl"` in both LTR and RTL document modes
- [ ] Form validation error messages render in the selected language
- [ ] No hardcoded English strings remain in `RecipeEditor.jsx` or `RecipeModal.jsx`

## Blocked by

- [#0002 i18n foundation + RTL + `LanguageSwitcher` wiring](./0002-i18n-foundation-rtl-language-switcher.md)
