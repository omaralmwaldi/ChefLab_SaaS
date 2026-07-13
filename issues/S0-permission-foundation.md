# S0 — Permission foundation (storage, owner, fresh session)

Source PRD: `docs/prd-rbac-v2.md`

## What to build

The skeleton every other slice hangs off. Change `Role.permissions` from a `{ key: true }` map to a JSON array of granted permission keys (absence = denied). Add `Organization.ownerUserId` identifying the organization owner, who holds no role and bypasses all RBAC. Introduce a single `hasPermission(req, key)` decision point — true if the caller is the owner, otherwise whether the granted array contains the key — and route the existing `requirePermission` middleware through it so the owner short-circuits every guarded endpoint. Enrich `GET /auth/me` to return the current user together with their granted-permissions array and an `isOwner` flag, read fresh from the database, so clients can refresh permissions without re-login. Ship a data migration that converts every role's permission map to an array (preserving existing two-part keys verbatim) and sets each organization's owner to the earliest-created user holding an administrator-type role, falling back to the earliest-created user, clearing that user's role assignment.

## Acceptance criteria

- [ ] `Role.permissions` stores and is read as an array of granted keys; existing two-part keys (`recipes.view`, etc.) are preserved.
- [ ] `Organization.ownerUserId` exists; the owner has no `roleId`.
- [ ] `hasPermission(req, key)` returns true for the owner on any key, and for role users only when the key is in their granted array.
- [ ] Every existing guarded route still returns `200` for a permitted role and `403` for an unpermitted one, scoped by organization.
- [ ] The organization owner receives `200` on every guarded route regardless of role.
- [ ] `GET /auth/me` returns the user, their granted-permissions array, and `isOwner`, reflecting the current database state.
- [ ] Migration converts all existing roles and assigns an owner per organization without granting any new permission keys.

## Blocked by

- None — can start immediately.
