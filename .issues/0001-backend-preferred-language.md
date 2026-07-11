# Backend — `preferredLanguage` field + `PATCH /auth/language`

## What to build

Add a `preferredLanguage` column (`"en"` | `"ar"`, default `"en"`) to the `users` table via a new Prisma migration. Expose a `PATCH /auth/language` endpoint that accepts `{ preferredLanguage: "en" | "ar" }`, validates the value with Zod, and updates the field for the requesting user (identified from JWT — no special permission required). Update `toAuthUser` in `auth.mapper.js` to include `preferredLanguage` in both the login response and the `/auth/me` response.

This slice is pure backend — no frontend changes.

## Acceptance criteria

- [ ] Migration adds `preferredLanguage` column with default `"en"` and `NOT NULL` constraint
- [ ] `POST /auth/login` response includes `preferredLanguage`
- [ ] `GET /auth/me` response includes `preferredLanguage`
- [ ] `PATCH /auth/language` with `{ preferredLanguage: "ar" }` returns 200; subsequent `GET /auth/me` returns `preferredLanguage: "ar"`
- [ ] `PATCH /auth/language` with an invalid value returns 400 with Zod error shape
- [ ] `PATCH /auth/language` without a valid JWT returns 401
- [ ] Existing users seeded before migration get default value `"en"`

## Blocked by

None — can start immediately.
