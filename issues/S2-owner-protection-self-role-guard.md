# S2 — Owner user-record protection + self role-assignment guard

Source PRD: `docs/prd-rbac-refinements.md`

## What to build

Protect the organization owner's user record and stop self privilege escalation via role reassignment, enforced in the User service update/delete path (where the target record identity is known), not in middleware.

**Owner protection.** The owner is identified via `Organization.ownerUserId`. Deleting the owner is refused for everyone, including the owner themselves — the organization must always keep its owner. Editing the owner is allowed only when the actor is the owner acting on their own record (name, email, phone, language, password); any other actor targeting the owner is refused with HTTP 403 (same-organization, so the owner's existence is not hidden). The owner continues to hold no role and to bypass permission checks.

**Self role-assignment guard.** A non-owner with `users.manage` may assign roles to other users but cannot change their own role: an update where the actor is the target and the request alters `roleId` is rejected regardless of permissions held. The owner is unaffected (owner requests short-circuit upstream and never reach this guard). Refusals are clear, not generic breakage.

## Acceptance criteria

- [ ] `DELETE /users/:ownerId` returns a refusal for every actor including the owner; the owner record remains.
- [ ] The owner can `PUT` their own profile fields successfully.
- [ ] A non-owner (even with `users.manage`) editing or deleting the owner receives `403`.
- [ ] A non-owner with `users.manage` can change another user's `roleId` but receives a refusal when altering their own `roleId`.
- [ ] The owner is unaffected by the self-role guard.
- [ ] Refusal responses carry a clear message distinguishing "forbidden" from a server error.

## Blocked by

- None — can start immediately.
