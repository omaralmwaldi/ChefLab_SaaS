# Signup 3 — Hardening: signup validation & error surface

Parent PRD: `docs/prd-organization-signup.md`

## What to build

Complete and harden the backend failure paths of signup so every rejection is clear and no bad tenant is ever persisted.

> Frontend Register page error surface split out to `signup-3b-register-error-surface-frontend.md`.

Backend:
- Duplicate email (already registered in any organization) surfaces as Prisma P2002, caught in the service and mapped by the controller to **409** with "Email already registered" (not a generic 500), with no organization/user persisted.
- Validation failures return **400** with `{ errors }`: password fails a strength rule (error names the failed rule), `confirmPassword` ≠ `password`, missing required field, invalid `preferredLanguage`.

## Acceptance criteria

- [ ] Duplicate email → 409 "Email already registered", and no new org/user is persisted
- [ ] Weak password → 400 with a field error naming the failed rule
- [ ] `confirmPassword` ≠ `password` → 400
- [ ] Missing required field → 400
- [ ] Invalid `preferredLanguage` → 400
- [ ] `confirmPassword` is never stored
- [ ] Request-level tests cover each failure case at the `POST /auth/signup` seam

## Blocked by

- Signup 2 — Tracer: organization signup happy path
