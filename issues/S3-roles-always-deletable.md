# S3 — Roles always deletable (SetNull / Cascade)

Source PRD: `docs/prd-rbac-refinements.md`

## What to build

Make role deletion always succeed, without destroying people or damaging recipes, via schema `onDelete` behavior plus removing the application-level block.

Schema changes: `RecipeStepRole.role` gains `onDelete: Cascade` (deleting a role removes its step-role join rows; the `RecipeStep` rows survive). `User.role` gains `onDelete: SetNull` (deleting a role sets each affected user's `roleId` to null — already nullable). A null-role, non-owner user resolves to an empty granted-permission set (locked out until reassigned; no auto-reassignment). Remove the Role service's existing "cannot delete role with assigned users" block so deletion always proceeds, never returning an obscure database (foreign-key) error.

## Acceptance criteria

- [ ] `DELETE /roles/:id` succeeds while the role is assigned to one or more users; those users' subsequent profiles show a null role.
- [ ] `DELETE /roles/:id` succeeds while the role is referenced by recipe steps; the step-role joins are gone and the steps themselves remain.
- [ ] A user left at null role resolves to zero granted permissions (denied on all guarded routes; owner unaffected).
- [ ] Deletion never surfaces a raw Prisma/foreign-key error; the action is predictable.
- [ ] The previous "block if assigned to a user" behavior is gone.

## Blocked by

- None — can start immediately. (Touches the role delete route re-guarded to `roles.manage` in S1; if built in parallel, expect a small merge on that route.)
