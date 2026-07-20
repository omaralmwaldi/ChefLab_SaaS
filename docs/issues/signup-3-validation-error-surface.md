# Signup 3 — Hardening: signup validation & error surface

Parent PRD: `docs/prd-organization-signup.md`

## What to build

Complete and harden the failure paths of signup so every rejection is clear and no bad tenant is ever persisted, across backend and frontend.

Backend:
- Duplicate email (already registered in any organization) surfaces as Prisma P2002, caught in the service and mapped by the controller to **409** with "Email already registered" (not a generic 500), with no organization/user persisted.
- Validation failures return **400** with `{ errors }`: password fails a strength rule (error names the failed rule), `confirmPassword` ≠ `password`, missing required field, invalid `preferredLanguage`.

Frontend:
- Register page mirrors required-field, password-match, and password-strength checks for fast feedback (backend stays authoritative).
- Displays the server's field errors inline and preserves entered data on failure so the user doesn't retype.

## Acceptance criteria

- [ ] Duplicate email → 409 "Email already registered", and no new org/user is persisted
- [ ] Weak password → 400 with a field error naming the failed rule
- [ ] `confirmPassword` ≠ `password` → 400
- [ ] Missing required field → 400
- [ ] Invalid `preferredLanguage` → 400
- [ ] `confirmPassword` is never stored
- [ ] Register page shows inline errors for each failure case and keeps entered input
- [ ] Request-level tests cover each failure case at the `POST /auth/signup` seam

## Blocked by

- Signup 2 — Tracer: organization signup happy path
