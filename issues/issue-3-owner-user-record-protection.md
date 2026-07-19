# Owner user-record protection + self role-assignment guard

**Label:** ready-for-agent
**Source PRD:** `docs/prd-rbac-refinements.md`

## What to build

Protect the organization owner's user account so it can never be deleted and can only be edited by the owner themselves, and prevent any non-owner from escalating their own privileges by changing their own role. Both are guards on the same User-service write path.

End-to-end behavior:

- The checks are enforced in the User service (where update and delete already live), because they depend on the identity of the target record relative to the actor, not just the actor's permissions.
- **Delete owner:** refused for everyone, including the owner acting on their own account. The organization must always retain its owner.
- **Edit owner:** allowed only when the actor is the owner acting on their own record. Any other actor targeting the owner is refused with **HTTP 403** (same organization, so the owner's existence is not hidden).
- **Self role-assignment guard:** a non-owner with `users.manage` may assign roles to *other* users but cannot change their own role. An update where the actor is the target and the request alters `roleId` (or equivalent) is rejected regardless of permissions held. The owner is unaffected — owner requests bypass permission checks upstream (the `isOwner` short-circuit) and never reach this guard.
- The owner continues to hold no role and to bypass all permission checks (unchanged).
- The frontend hides edit and delete controls on the owner's row for non-owner users, so the refusal is not reached through normal use.

## Acceptance criteria

- [ ] Deleting the owner user returns a refusal for a non-owner actor and also for the owner acting on themselves; the owner record remains.
- [ ] The owner can successfully edit their own profile fields (name, email, phone, language, password).
- [ ] A non-owner with user-management permission editing or deleting the owner receives HTTP 403.
- [ ] A non-owner with `users.manage` can change another user's role, but is refused when changing their own role.
- [ ] The owner can change their own record without being blocked by the self-role guard.
- [ ] The user list UI does not render edit/delete actions on the owner row for non-owner users.
- [ ] Behavior is covered by HTTP-seam tests using the harness from slice 1.

## User stories covered

PRD stories 10, 11, 12, 13, 14, 15, 26, 27, 28.

## Blocked by

- Slice 1 (Permission catalog collapse + migration + test harness) — needs the test harness and the `users.manage` guard on the write routes.
