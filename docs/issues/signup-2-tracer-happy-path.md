# Signup 2 — Tracer: organization signup happy path (end-to-end)

Parent PRD: `docs/prd-organization-signup.md`

## What to build

The backend happy-path registration flow: a public signup endpoint that atomically creates a new organization and its owner.

> Frontend Register page split out to `signup-2b-register-page-frontend.md`.

Backend — `POST /auth/signup` (public, no auth middleware):
- Accepts `{ organizationName, name, email, password, confirmPassword, preferredLanguage }`.
- Validates with a new `signupSchema` (reusing the exported `passwordRule`; `confirmPassword` must equal `password` and is never persisted; `preferredLanguage` is `en`/`ar`).
- In a single transaction: create the organization (`ownerUserId = null`) → create the first user (`roleId = null`, bcrypt hash cost 10, chosen language) → set the organization's `ownerUserId` to the new user.
- Returns **201** with `{ token, user }`, identical in shape to login, built through the existing `toAuthUser` mapper so `isOwner` is `true`.

## Acceptance criteria

- [ ] `POST /auth/signup` returns 201 with `{ token, user }`
- [ ] Response `user.isOwner === true` and `user.roleId === null`
- [ ] Created organization's `ownerUserId` equals the new user's id
- [ ] Org + user creation is atomic (failure leaves no orphan org or user)
- [ ] Returned token authenticates against `GET /auth/me`
- [ ] New owner can afterward log in via `POST /auth/login` with the same credentials
- [ ] Request-level test covers the happy path at the `POST /auth/signup` seam

## Blocked by

- Signup 1 — Prefactor: global-unique email
