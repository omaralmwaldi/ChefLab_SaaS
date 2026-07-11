# PRD: Full Bilingual Support (English & Arabic)

## Problem Statement

ChefLab is used by restaurant and café teams that operate in Arabic-speaking environments. The application is currently English-only in its UI — navigation labels, button text, form labels, error messages, and status indicators all appear in English regardless of the user's language. While the database already stores bilingual data (`nameEn`/`nameAr` pairs for every entity), view pages display both languages simultaneously — a compromise that clutters the display. There is no way for a user to set or save a preferred language, and no RTL layout support.

---

## Solution

Introduce a first-class application language toggle (English / Arabic). Each user's preference is stored in their profile in the database, persists across devices and sessions, and is applied immediately on login. When Arabic is selected, the entire layout flips to RTL (sidebar moves to the right, text aligns right), and all UI chrome — labels, buttons, headers, error messages — renders in Arabic. View pages show only the selected language's field (`nameAr` in Arabic mode, falling back to `nameEn` if the Arabic value is empty). Create and Edit forms always show both `nameEn` and `nameAr` input fields so authors can maintain both translations; the labels on those fields follow the selected application language.

---

## User Stories

1. As a restaurant operator, I want to set the application language to Arabic, so that the entire UI — navigation, buttons, labels, and error messages — appears in Arabic.
2. As a ChefLab user, I want my language preference remembered across login sessions and devices, so that I don't have to re-select my language each time.
3. As a ChefLab user, I want a language toggle visible on the login screen, so that I can interact with the authentication form in my preferred language before logging in.
4. As an Arabic-speaking user, I want the page layout to switch to right-to-left direction when I select Arabic, so that the reading flow and element alignment match the Arabic writing system.
5. As an Arabic-speaking user, I want the sidebar navigation to appear on the right side of the screen when Arabic is selected, so that the layout feels native rather than mirrored.
6. As an Arabic-speaking user viewing the recipe list, I want to see only the Arabic name of each recipe, so that I'm not distracted by English text I don't need.
7. As an Arabic-speaking user viewing a recipe's detail page, I want to see ingredient names, step titles, and step descriptions in Arabic only, so that kitchen staff can follow instructions in their language.
8. As an Arabic-speaking user viewing the ingredient list, I want ingredient names displayed in Arabic, so that I can scan and identify items quickly.
9. As an Arabic-speaking user viewing the category list, I want category names displayed in Arabic.
10. As an Arabic-speaking user viewing the roles list, I want role names displayed in Arabic.
11. As a ChefLab user, I want a recipe with no Arabic translation to fall back to its English name in Arabic mode, so that untranslated content is still accessible rather than blank.
12. As a recipe author, I want both the English and Arabic name fields always visible when creating or editing a recipe, so that I can maintain both translations in one step.
13. As a recipe author, I want both the English and Arabic title and description fields always visible for each recipe step in the editor, so that I can write step instructions in both languages.
14. As a recipe author, I want the labels on English and Arabic form fields to change to my selected application language, so that the form feels consistent with the rest of the UI.
15. As a recipe author, I want validation and error messages in forms to appear in my selected language, so that I understand what went wrong.
16. As an admin managing ingredients, I want all ingredient form labels to appear in my selected language, so that data entry is comfortable.
17. As an admin managing categories, I want all category form labels and confirmation dialogs to appear in my selected language.
18. As an admin managing users, I want all user management screens — including the create/edit user modal and the set-password dialog — to appear in my selected language.
19. As an admin managing roles, I want role form labels and permission group names to appear in my selected language.
20. As a ChefLab user, I want the delete confirmation dialog to appear in my selected language, so that I understand the consequences of the action.
21. As a ChefLab user, I want pagination controls ("Previous", "Next") to appear in my selected language.
22. As a kitchen staff member, I want media uploader messages (upload progress, error text) to appear in my selected language, so that I understand the state of file uploads.
23. As an admin, I want to be able to set a user's preferred language when creating or updating their profile, so that I can onboard Arabic-speaking staff with the correct default.
24. As an Arabic-speaking user, I want Arabic text to render in a legible Arabic typeface, so that the text is readable and well-proportioned.
25. As an English-speaking user, I want all UI behavior unchanged when English is selected, so that the existing experience is not disrupted.
26. As a ChefLab user, I want the dashboard stat cards and chart labels to appear in my selected language.
27. As a ChefLab user, I want my role name (shown under my avatar in the sidebar) to display in my selected language.
28. As an Arabic-speaking user, I want the "Sign Out" button in the sidebar to appear in Arabic.
29. As a ChefLab user, I want status badge labels (Draft, Closed) to appear in my selected language on recipe list and detail pages.
30. As a ChefLab user, I want shelf life unit labels (Hour, Day, Week, Month) and storage place labels (Room Temperature, Chiller, Freezer) to appear in my selected language on the recipe detail page.

---

## Implementation Decisions

### Language Preference Storage
User language preference is stored as a `preferredLanguage` field on the User model with values `"en"` or `"ar"` and default `"en"`. This field is the authoritative source for logged-in users. `localStorage` serves as a bootstrap cache so the login page toggle works before authentication. On login or session restore (`/auth/me`), the DB value wins and overwrites `localStorage`.

### Schema Change
A `preferredLanguage` column is added to the `users` table via a new Prisma migration. Default value: `"en"`.

### New API Endpoint: `PATCH /auth/language`
A dedicated endpoint accepts `{ preferredLanguage: "en" | "ar" }` and updates the field for the requesting user (identified from their JWT). This endpoint requires only JWT authentication — no special permission — because any user should be able to update their own language. It is intentionally separate from the admin-gated `PUT /users/:id` endpoint.

### Login and Session Response
The auth mapper (`toAuthUser`) is updated to include `preferredLanguage` in both the login and `/auth/me` responses. This allows the client to sync i18next immediately on session start without an extra round-trip.

### i18n Library
`react-i18next` + `i18next` + `i18next-browser-languagedetector` are installed on the frontend. All hardcoded UI strings are extracted into two JSON translation files — English (`en.json`) and Arabic (`ar.json`) — organised by feature namespace: `common`, `nav`, `recipes`, `categories`, `ingredients`, `users`, `roles`.

### RTL Implementation
The application language drives the `dir` attribute on the root `<html>` element (`"ltr"` for English, `"rtl"` for Arabic) and the `lang` attribute. This is wired to the i18next `languageChanged` event. All physical directional Tailwind utilities (`mr-*`, `ml-*`, `pr-*`, `pl-*`, `right-*`, `left-*`, `text-left`) are replaced with CSS logical-property equivalents (`me-*`, `ms-*`, `pe-*`, `ps-*`, `end-*`, `start-*`, `text-start`) so the layout mirrors automatically when the document `dir` changes. The sidebar moves to the right in RTL via natural flex row reversal.

### Bilingual Display Rules

**View pages** (list pages, detail/read-only pages) use a shared `pick(entity, field, lang)` helper:
- When `lang === "ar"`: returns `entity.nameAr || entity.nameEn` (English fallback if Arabic is empty)
- When `lang === "en"`: returns `entity.nameEn`

This applies to all bilingual field pairs: `nameEn`/`nameAr`, `titleEn`/`titleAr`, `descriptionEn`/`descriptionAr`.

**Create/Edit forms** always render both `nameEn` and `nameAr` input fields (and the equivalent pairs for recipe steps). The labels on those fields are translated via `t()`. Arabic-specific `<input>` fields retain explicit `dir="rtl"` attributes regardless of document direction, since they must always accept Arabic text even when the UI is in English mode.

### Language Switcher Component
A `LanguageSwitcher` component renders an EN / AR pill toggle. On click it calls `i18n.changeLanguage()` and — if the user is authenticated — calls `PATCH /auth/language`. The component is mounted in both the authenticated Layout header and on the unauthenticated Login page.

### Auth Sync
After a successful login or `/auth/me` response, `AuthProvider` calls `i18n.changeLanguage(user.preferredLanguage)`, which triggers the `languageChanged` event and cascades to RTL, font, and document `dir` updates.

### Arabic Font
A legible Arabic typeface (Cairo — covers both Arabic and Latin scripts) is loaded via Google Fonts and applied to the document when `dir="rtl"` is active, scoped via CSS on the root `[dir=rtl]` selector.

---

## Testing Decisions

**What makes a good test:** Tests should verify observable external behavior — what the user or API consumer sees — not implementation details like which internal function was called, what Tailwind class is present, or what i18next state looks like internally.

**Primary seam — `PATCH /auth/language` API endpoint:**
This is the single highest-value seam. A good test: authenticate as a user, send `PATCH /auth/language` with `{ preferredLanguage: "ar" }`, then call `GET /auth/me` and assert the returned `preferredLanguage` is `"ar"`. Tests the entire backend path — JWT validation, DB write, response — with no mocking required.

**Secondary seam — `pick(entity, field, lang)` display helper:**
A pure function with no external dependencies. Key test cases:
- `lang = "ar"`, `nameAr` populated → returns Arabic value
- `lang = "ar"`, `nameAr` empty string → returns English fallback
- `lang = "en"` → always returns English value

**Prior art:** The project currently has no automated test suite (no test script in `package.json`). If tests are introduced, Vitest is the natural fit for the pure `pick()` helper (ESM, fast). Supertest against a real test database covers the API seam, consistent with how the backend's Prisma-based architecture is designed to be tested.

---

## Out of Scope

- **Eastern Arabic numerals:** All numbers (costs, quantities, SKUs, dates) render in Western numerals (0–9) regardless of language.
- **RTL currency formatting:** The "SAR" label and cost formatting remain unchanged.
- **Arabic pluralisation:** Arabic has six grammatical number forms. Count strings ("3 Recipes", "1 Category") use simple English-style pluralisation in both languages for now.
- **Missing-translation warnings:** There is no UI indicator if an entity lacks an Arabic translation. The system silently falls back to English.
- **Additional languages:** Only English and Arabic. The architecture is extensible but no third language is planned.
- **Server-side error message translation:** Zod validation errors and Prisma error messages returned from the API remain in English.
- **Organization-level default language:** Language preference is per-user only, not per-organization.

---

## Further Notes

- Tailwind v4 is in use (Vite plugin, no standalone config file). Logical property utilities (`ps-*`, `pe-*`, `ms-*`, `me-*`, `inset-s-*`, `inset-e-*`) are available natively in v4 without any plugin — no config change is needed to use them.
- There are currently 16 spot-applied `dir="rtl"` attributes on individual Arabic text display elements across the codebase. These should be removed from view-mode elements once the document-level `dir` is in place, but must be kept on Arabic `<input>` and `<textarea>` fields in Create/Edit forms.
- The permission middleware is currently empty (no RBAC enforcement beyond JWT). The `PATCH /auth/language` endpoint needs only JWT authentication, consistent with the current security posture.
- The full architectural decisions and implementation phase breakdown are documented in `~/.claude/plans/q1-option-b-user-zazzy-spindle.md`.
