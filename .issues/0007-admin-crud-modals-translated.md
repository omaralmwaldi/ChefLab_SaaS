# Admin CRUD modals translated (ingredients, categories, roles, users)

## What to build

Replace all hardcoded strings in `IngredientModal.jsx`, `CategoryModal.jsx`, `RoleModal.jsx`, `UserModal.jsx`, and `NewPasswordDialog.jsx` with `t()` calls using the relevant feature namespaces (`ingredients`, `categories`, `roles`, `users`). Arabic input fields in each modal must retain explicit `dir="rtl"`. The user create/edit modal must expose a `preferredLanguage` selector (`"en"` / `"ar"`) so admins can set the language preference when onboarding staff — this writes to the `preferredLanguage` field added in slice 1 via the existing `PUT /users/:id` endpoint.

## Acceptance criteria

- [ ] All labels, placeholders, button text, and error messages in IngredientModal render in the selected language
- [ ] All labels in CategoryModal render in the selected language
- [ ] All labels and permission group names in RoleModal render in the selected language
- [ ] All labels in UserModal and NewPasswordDialog render in the selected language
- [ ] UserModal includes a `preferredLanguage` field (EN / AR selector); saving it persists via `PUT /users/:id`
- [ ] Arabic input fields in all modals carry `dir="rtl"`
- [ ] No hardcoded English strings remain in any of the five files

## Blocked by

- [#0002 i18n foundation + RTL + `LanguageSwitcher` wiring](./0002-i18n-foundation-rtl-language-switcher.md)
