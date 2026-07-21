# Signup 3b — Frontend: Register page validation & error surface

Parent PRD: `docs/prd-organization-signup.md`

## What to build

Harden the Register page failure paths so every rejection is clear and the user never loses their input. Client-side checks give fast feedback; the backend stays authoritative.

Frontend:
- Register page mirrors required-field, password-match, and password-strength checks for fast feedback (backend stays authoritative).
- Displays the server's field errors (`{ errors }` 400, and 409 "Email already registered") inline and preserves entered data on failure so the user doesn't retype.

## Acceptance criteria

- [ ] Client-side: required-field, password-match, and password-strength checks block submit with inline errors
- [ ] Server 400 `{ errors }` shown inline per field (weak password, mismatch, missing field, invalid `preferredLanguage`)
- [ ] Server 409 "Email already registered" shown inline
- [ ] Entered input is preserved on any failure (user does not retype)

## Blocked by

- Signup 2b — Frontend: Register page
- Signup 3 — Hardening: signup validation & error surface (backend)
