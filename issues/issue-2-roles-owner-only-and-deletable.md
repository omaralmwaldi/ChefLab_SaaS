# Roles module — owner-only writes + always-deletable

**Label:** ready-for-agent
**Source PRD:** `docs/prd-rbac-refinements.md`

## What to build

Make role administration an owner-only capability and make roles deletable at any time without destroying people or damaging recipes. This merges the role-authorization and role-deletion concerns because both live entirely in the roles module.

End-to-end behavior:

- **Owner-only writes.** Creating, editing, and deleting a role is restricted to the organization owner (identified via `Organization.ownerUserId`). A new owner-only guard replaces the previous permission-based guard on the role write routes. Any non-owner attempting a role write is refused with **HTTP 403**, regardless of their permissions — so no user can grant themselves additional permissions through the Role Editor. Role list/detail routes remain guarded by `roles.view`, so users managing people can still see and assign roles.
- **Always deletable.** Deleting a role always succeeds. Users assigned to the deleted role keep their accounts and fall back to no role (a null-role non-owner resolves to an empty permission set until reassigned). Recipe steps that referenced the role lose that role assignment, but the steps themselves survive. This is achieved by the schema relations `RecipeStepRole.role → onDelete: Cascade` and `User.role → onDelete: SetNull` (roleId is already nullable), plus a migration; the service's former "cannot delete role with assigned users" block is removed and no obscure database error surfaces.

## Acceptance criteria

- [ ] A non-owner (even with broad permissions) receives 403 on role create, edit, and delete; the owner succeeds on all three.
- [ ] `roles.view` holders can still list and read roles (to populate the user role picker).
- [ ] Deleting a role assigned to users returns success; those users afterward have a null role and an empty effective permission set, and are not deleted.
- [ ] Deleting a role referenced by recipe steps returns success; the step-role assignments are removed, and the recipe steps still exist.
- [ ] Role deletion never returns a raw foreign-key/database error.
- [ ] Behavior is covered by HTTP-seam tests using the harness from slice 1.

## User stories covered

PRD stories 4, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25.

## Blocked by

- Slice 1 (Permission catalog collapse + migration + test harness) — needs the retired roles write keys, the re-guarded routing, and the harness.
