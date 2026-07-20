# Signup 1 — Prefactor: global-unique email

Parent PRD: `docs/prd-organization-signup.md`

## What to build

Make `User.email` globally unique across all tenants and expose the existing password strength rule for reuse. This is a prefactor that unblocks the signup flow: email-based login is only correct when email is unique across every organization, and the signup validator should reuse the one password rule rather than redefine it.

- Change `User.email` to a global unique constraint; drop the now-redundant per-tenant composite unique on `(organizationId, email)`. Keep the `(id, organizationId)` composite.
- Generate and apply a Prisma migration and regenerate the Prisma client.
- Export the existing `passwordRule` (min 10, upper/lower/number/special) from the users validation module so the auth module can import it.

Precondition confirmed: no cross-organization duplicate emails currently exist, so the unique index applies cleanly.

## Acceptance criteria

- [ ] `User.email` is globally unique at the database level
- [ ] The old `@@unique([organizationId, email])` constraint is removed; `@@unique([id, organizationId])` retained
- [ ] Migration created and applied; Prisma client regenerated
- [ ] `passwordRule` is importable from the users module (single source of truth, no duplication)
- [ ] Existing user-creation and login behavior still pass

## Blocked by

None - can start immediately.
