# `pick()` helper + bilingual view and list pages

## What to build

Create a shared `pick(entity, field, lang)` helper that returns the localized value for any bilingual field pair:
- `lang === "ar"`: returns `entity[fieldAr] || entity[fieldEn]` (English fallback when Arabic is empty)
- `lang === "en"`: returns `entity[fieldEn]`

Apply this helper across all view and list pages so each entity name renders in only the selected language. Affected pages: `RecipeListPage`, `RecipeViewPage` (recipe name, ingredient names, step titles and descriptions), `IngredientListPage`, `CategoryListPage`, `RoleListPage`, and the dashboard stat cards and chart labels in `dashBoardPage`. Remove the 16 spot-applied `dir="rtl"` attributes from view-mode display elements now that the document-level `dir` is set (keep them only on Arabic `<input>` / `<textarea>` fields in forms).

## Acceptance criteria

- [ ] `pick(entity, "name", "ar")` returns `entity.nameAr` when populated; falls back to `entity.nameEn` when `nameAr` is empty
- [ ] `pick(entity, "name", "en")` always returns `entity.nameEn`
- [ ] Recipe list shows only Arabic names in Arabic mode, only English names in English mode
- [ ] Recipe detail page shows Arabic ingredient names, step titles, and step descriptions in Arabic mode
- [ ] Ingredient, category, and role lists show Arabic names in Arabic mode
- [ ] Dashboard stat card labels and chart labels reflect the selected language
- [ ] No entity on any view/list page shows both language values simultaneously in either mode
- [ ] No stale `dir="rtl"` attributes remain on non-input display elements

## Blocked by

- [#0002 i18n foundation + RTL + `LanguageSwitcher` wiring](./0002-i18n-foundation-rtl-language-switcher.md)
