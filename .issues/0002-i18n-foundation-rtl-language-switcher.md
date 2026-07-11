# i18n foundation + RTL + `LanguageSwitcher` wiring

## What to build

Install `react-i18next`, `i18next`, and `i18next-browser-languagedetector`. Create two translation JSON files — `en.json` and `ar.json` — with namespace skeletons (`common`, `nav`, `recipes`, `categories`, `ingredients`, `users`, `roles`). Wire the `dir` and `lang` attributes on the root `<html>` element to i18next's `languageChanged` event (`"ltr"` / `"rtl"`, `"en"` / `"ar"`). Load the Cairo typeface via Google Fonts and apply it under the `[dir=rtl]` CSS selector. Build a `LanguageSwitcher` component (EN / AR pill toggle) that calls `i18n.changeLanguage()` and — when authenticated — calls `PATCH /auth/language`. Mount the switcher in the authenticated `Layout` header and on the `LoginPage`. Update `AuthProvider` to call `i18n.changeLanguage(user.preferredLanguage)` after a successful login or `/auth/me` response, so the DB value wins and overwrites `localStorage`. Replace all physical directional Tailwind utilities (`mr-*`, `ml-*`, `pr-*`, `pl-*`, `right-*`, `left-*`, `text-left`) across shared components with CSS logical-property equivalents (`me-*`, `ms-*`, `pe-*`, `ps-*`, `end-*`, `start-*`, `text-start`).

## Acceptance criteria

- [ ] Switching to Arabic sets `<html dir="rtl" lang="ar">` and switching to English sets `<html dir="ltr" lang="en">`
- [ ] Cairo font renders on Arabic-mode pages
- [ ] `LanguageSwitcher` is visible on the Login page (unauthenticated)
- [ ] `LanguageSwitcher` is visible in the authenticated Layout header
- [ ] Toggling language when authenticated calls `PATCH /auth/language` (verifiable in network tab)
- [ ] After login, the language switches to the value stored in the DB without a page reload
- [ ] After page refresh, `localStorage` bootstrap shows the correct language before the `/auth/me` response arrives; DB value overwrites it on response
- [ ] Layout does not break visually in either direction (no hardcoded `left-*`/`right-*` classes remain in shared components)

## Blocked by

- [#0001 Backend — `preferredLanguage` field + `PATCH /auth/language`](./0001-backend-preferred-language.md)
