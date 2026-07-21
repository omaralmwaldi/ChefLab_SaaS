# Signup 2b — Frontend: Register page (organization signup)

Parent PRD: `docs/prd-organization-signup.md`

## What to build

A public Register page that submits the organization signup form to the already-built `POST /auth/signup` endpoint and, on success, drops the new owner straight into the app by reusing the existing login success path.

Frontend — Register page:
- Fields: organization name, name, email, password, confirm password, language (EN/AR).
- Submits `{ organizationName, name, email, password, confirmPassword, preferredLanguage }` to `POST /auth/signup`.
- On success (**201** `{ token, user }`), reuses the existing login success path: store token, set user, redirect into the app.

## Acceptance criteria

- [ ] Register page renders all fields: organization name, name, email, password, confirm password, language (EN/AR)
- [ ] Submits to `POST /auth/signup` with the correct payload shape
- [ ] On success, signs the user in (store token, set user) and redirects into the app — same path as login
- [ ] New owner is dropped into the app authenticated (token works against `GET /auth/me`)

## Blocked by

- Signup 2 — Tracer: organization signup happy path (backend `POST /auth/signup`)
