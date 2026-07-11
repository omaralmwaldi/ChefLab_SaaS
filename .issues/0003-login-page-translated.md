# Login page translated

## What to build

Replace all hardcoded English strings in `LoginPage` and `LoginBox` with `t()` calls using the `common` namespace. Add the corresponding translations to both `en.json` and `ar.json`. The `LanguageSwitcher` (mounted in slice 2) must be operable before authentication so the user can read the login form in Arabic before submitting credentials.

## Acceptance criteria

- [ ] All labels, placeholders, button text, and error messages on the Login page render in English when the app language is `"en"`
- [ ] All Login page strings render in Arabic when the app language is `"ar"`
- [ ] Toggling the language switcher on the Login page updates the form labels immediately without a page reload
- [ ] No hardcoded English string remains in `LoginPage.jsx` or `LoginBox.jsx`

## Blocked by

- [#0002 i18n foundation + RTL + `LanguageSwitcher` wiring](./0002-i18n-foundation-rtl-language-switcher.md)
