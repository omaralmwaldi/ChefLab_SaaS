# PRD: RBAC Refinements (Manage Permissions, Owner Protection, Role Deletion, Step Visibility)

Follow-up to **Granular RBAC v2** (`prd-rbac-v2.md`). That PRD established the feature/action permission catalog, cost-visibility stripping, the owner-outside-RBAC model, and frontend permission awareness. This PRD refines four rough edges surfaced after v2 landed.

---

## Problem Statement

RBAC v2 shipped a per-module CRUD catalog and an owner bypass, but day-to-day use exposed four problems:

1. **Too many permission checkboxes.** For simple modules (Ingredients, Categories, Users, Roles) an administrator must toggle three separate keys — `create`, `edit`, `delete` — that in practice are always granted together. The Role Editor is noisier than the mental model ("this person manages ingredients").
2. **The organization owner is not protected as a user record.** The owner bypasses permission checks, but nothing stops another sufficiently-privileged user from **editing or deleting the owner's user account**, which can lock an organization out of its own owner.
3. **A role cannot be deleted while it is in use.** A role referenced by a recipe step (`RecipeStepRole`) fails to delete at the database level (foreign-key restrict), and a role assigned to a user is blocked by application logic. Administrators cannot retire obsolete roles without manually unpicking every reference first.
4. **The owner sees no recipe steps.** Recipe steps are filtered to the signed-in user's assigned role. The owner holds no role (`roleId = null`), so the filter matches nothing and the owner — who should see everything — sees an empty steps list. The filter also runs only on the frontend, so any authenticated user can read every step via the API regardless of their role.

## Solution

From the user's perspective:

- **Simpler roles.** Ingredients, Categories, Users, and Roles each expose a single **Manage** permission that covers create, edit, and delete, plus a separate **View**. Recipes keep their granular create/edit/delete because recipe workflows genuinely need finer control. Selecting Manage in the Role Editor automatically selects View and locks it on, so a role can never edit a record it cannot open. A user with **Manage Roles** can create, edit, and delete roles like any other manage permission, but can never edit or delete the role assigned to their own account, so no one can escalate their own permissions.
- **Protected owner.** The owner's user account can never be deleted by anyone (including the owner). The owner can edit their own profile, but no other user can edit or delete the owner. Attempts by others are refused.
- **Roles are always deletable.** Deleting a role never fails and never deletes people. Any user holding the deleted role is simply un-assigned (their role becomes empty); any recipe-step assignment to that role is removed. The step itself survives.
- **The owner sees everything, enforced server-side.** The owner and any user who can edit recipes see all steps of a recipe. Everyone else sees only the steps assigned to their role, and this is enforced by the backend so the API never returns steps a user may not see.

## User Stories

### Manage permission (collapse of create/edit/delete)
1. As an administrator building a role, I want a single **Manage Ingredients** permission, so that I grant full ingredient control with one toggle instead of three.
2. As an administrator, I want a single **Manage Categories** permission, so that recipe-category control is one decision.
3. As an administrator, I want a single **Manage Users** permission, so that user administration is one decision.
4. As an administrator, I want a single **Manage Roles** capability, so that role administration is one decision (subject to a self-guard — see stories 22–25).
5. As an administrator, I want View to remain separate from Manage on every collapsed module, so that I can grant read-only access without granting write access.
6. As an administrator, I want selecting Manage to automatically select and lock View, so that I never create a role that can edit a record it cannot open.
7. As an administrator, I want Recipes to keep separate Create, Edit, and Delete permissions, so that I can, for example, let a sous-chef edit recipes but not delete them.
8. As an administrator with an existing role from before this change, I want my old create/edit/delete grants to be automatically converted to the new Manage grant, so that no one silently loses or gains access when the system updates.
9. As a developer, I want the permission catalog to remain the single backend source of truth after the collapse, so that the frontend Role Editor renders exactly the keys the backend recognizes.

### Owner user-record protection
10. As an organization owner, I want my user account to be impossible to delete, so that my organization can never be locked out of its owner.
11. As an organization owner, I want to edit my own profile information (name, email, phone, language, password), so that I can keep my own account current.
12. As an organization owner, I want no other user to be able to edit my account, so that no one can change my credentials or details.
13. As an organization owner, I want no other user to be able to delete my account, so that my access is permanent.
14. As an administrator with Manage Users, I want a clear refusal when I try to edit or delete the owner, so that I understand the action is forbidden rather than broken.
15. As an organization owner, I want to have no assigned role, so that my full access never depends on a role being configured correctly.

### Role deletion
16. As an administrator, I want to delete a role even while users are assigned to it, so that I can retire obsolete roles without editing every user first.
17. As an administrator, I want users of a deleted role to keep their accounts, so that deleting a role never destroys people.
18. As an administrator, I want a user whose role was deleted to fall back to no permissions until reassigned, so that removing a role never silently leaves elevated access.
19. As an administrator, I want to delete a role even while it is referenced by recipe steps, so that role cleanup is never blocked by recipe data.
20. As an administrator, I want the recipe steps of a deleted role to lose that role assignment while the steps themselves remain, so that recipes are not damaged by role cleanup.
21. As an administrator, I want role deletion to never return an obscure database error, so that the action always succeeds predictably.

### Manage Roles permission and self-guard
22. As an administrator with Manage Roles, I want to create, edit, and delete roles, so that I can administer the permission catalog without being the owner.
23. As an administrator with Manage Roles, I want to be unable to edit or delete the role assigned to my own account, so that I cannot grant myself additional permissions.
24. As an administrator with Manage Users but without Manage Roles, I want to still see the list of roles, so that I can assign an existing role when creating or editing a user.
25. As an organization owner, I want role management to work for me with no self-guard, because I hold no role and already have everything.

### Self role-assignment guard
26. As an administrator with Manage Users, I want to assign roles to other users but be unable to change my own role, so that I cannot escalate my own privileges.
27. As an administrator, I want my attempt to change my own role rejected regardless of which permissions I hold, so that the guard cannot be worked around.
28. As an organization owner, I want to remain unaffected by the self-role guard, so that owner account management is never obstructed.

### Recipe step visibility
29. As an organization owner, I want to see every step of every recipe, so that I have full visibility into kitchen procedures.
30. As a user who can edit recipes, I want to see all steps of a recipe, so that I can edit the full procedure.
31. As a line cook, I want to see only the steps assigned to my role, so that I focus on my part of the preparation.
32. As a line cook, I want steps assigned to other roles to be absent from the API response, not just hidden in the UI, so that sensitive procedure detail is genuinely protected.
33. As any recipe viewer, I want step filtering to apply consistently on both the recipe list and the recipe detail, so that visibility does not depend on which screen I opened.

## Implementation Decisions

### Permission catalog changes
- The catalog (backend single source of truth, mirrored in the frontend constants) drops `create`, `edit`, and `delete` for **Ingredients**, **Categories**, **Users**, and **Roles**, replacing each trio with a single **Manage** key. **View** keys are unchanged.
- **Roles** collapse like the other modules: role create/edit/delete become a single grantable `roles.manage` key. `roles.view` remains grantable so a user without `roles.manage` can still populate the role picker when managing users. A **self-guard** prevents a `roles.manage` holder from editing or deleting the role assigned to their own account (see Route guarding).
- **Recipes** keep the granular `create` / `edit` / `delete` / `view` keys unchanged.
- **Costs** (`costs.view`) and **Dashboard** (`access`, `analytics.view`) keys are unchanged.
- Adding or removing a catalog key must continue to surface automatically in the `GET /permissions` response and the grouped-by-module catalog, with no additional wiring — consistent with the existing catalog derivation.

### Route guarding
- Ingredient, Category, and User create/edit/delete routes are guarded by the module's new **Manage** permission instead of the retired per-action permissions. View routes remain guarded by the View permission.
- Role create/edit/delete routes are guarded by `roles.manage`. The role list/detail routes remain guarded by `roles.view`. The **self-guard** (a `roles.manage` holder may not edit or delete the role assigned to their own account) is enforced in the Role service, where the target role identity is known; the owner bypasses it via the existing `isOwner` short-circuit and holds no role anyway.

### Owner user-record protection
- Enforced in the User service (the seam where update and delete already live), not in middleware, because the check depends on the target record identity, not just the actor.
- **Delete owner:** refused for everyone, including the owner themselves. The organization must always retain its owner.
- **Edit owner:** allowed only when the actor is the owner acting on their own record. Any other actor targeting the owner is refused with **HTTP 403** (same-organization, so the owner's existence is not being hidden).
- The owner continues to hold no role and to bypass all permission checks (unchanged from v2).

### Self role-assignment guard
- Enforced in the same User service update path as owner protection. A non-owner with `users.manage` may assign roles to *other* users but cannot change their own role: an update where the actor is the target and the request alters `roleId` (or equivalent) is rejected, regardless of permissions held.
- The owner is unaffected — owner requests already bypass permission checks upstream (the `isOwner` short-circuit) and never reach this guard.

### Role deletion semantics (schema change)
- `RecipeStepRole.role` relation gains `onDelete: Cascade` — deleting a role removes its step-role join rows; the `RecipeStep` rows are untouched.
- `User.role` relation gains `onDelete: SetNull` — deleting a role sets each affected user's role to null (`roleId` is already nullable). A null-role, non-owner user resolves to an empty granted-permission set.
- The Role service's existing "cannot delete role with assigned users" block is **removed**. Deletion always proceeds.

### Recipe step visibility (backend enforcement)
- Step filtering moves from the frontend into the recipe read path (service layer), applied on both the single-recipe read and the recipe list.
- Visibility rule: a step is visible to the requester when the requester is the **owner**, OR holds **recipes.edit**, OR the step has a `RecipeStepRole` whose `roleId` equals the requester's `roleId`.
- The read path therefore needs request context (the requester's `roleId`, owner status, and edit capability) passed into the service, resolved via the existing owner/permission helpers.
- The frontend step filter becomes redundant and is aligned to trust the server response.

### Data migration
- A one-shot migration rewrites the `permissions` JSON array on every existing `Role`: `{ingredients,categories,users,roles}.{create,edit,delete}` collapse to the corresponding `.manage` key (de-duplicated). `view` and all recipe/cost/dashboard keys are preserved verbatim.

### Frontend Role Editor
- Renders the revised catalog: single Manage checkbox for Ingredients/Categories/Users/Roles; granular checkboxes for Recipes.
- Selecting Manage auto-checks View and disables un-checking View while Manage is set. This pairing is UX only; the backend does not implicitly grant View.

## Testing Decisions

- **No test framework exists in the repo today** (backend has no test script; frontend has only ESLint). A good test here asserts **external behavior at an HTTP seam**, never internal function calls or Prisma query shapes — e.g. "DELETE /roles/:id assigned to a user returns success and the user's subsequent profile shows a null role," not "deleteRole called prisma.role.delete once."
- **Recommended single seam:** the Express app mounted in-process and driven over HTTP (supertest-style) against a test database. This is the highest seam that exercises routing, the owner/permission guards, the services, and Prisma `onDelete` behavior together — the four refinement areas all converge there. Preferring one seam over per-layer unit tests keeps the suite aligned with observable behavior.
- **Modules to cover at that seam:**
  - Permissions: `GET /permissions` returns the collapsed catalog (manage keys present; retired create/edit/delete absent for the collapsed modules).
  - Roles: create/edit/delete accepted for a holder of `roles.manage`, refused (403) for a user without it; a `roles.manage` holder is refused (403) when editing or deleting the role assigned to their own account but accepted on any other role; delete succeeds while users/steps reference the role, un-assigning the user (null role) and removing the step-role join while the step survives.
  - Users: owner cannot be deleted by anyone (incl. self); owner edits self; non-owner editing/deleting owner gets 403; a non-owner with `users.manage` can change another user's role but is refused when changing their own role.
  - Recipes: owner and `recipes.edit` holders receive all steps; a role-scoped user receives only their role's steps from both list and detail.
- **Prior art:** none in-repo. The seam and any harness (test DB setup, JWT minting for actor roles including the owner) are established fresh by this work. Match the Controller → Service → Prisma conventions already documented so the harness mirrors production wiring.

## Out of Scope

- **Ownership transfer.** There is no mechanism to move ownership to another user; the owner remains permanent for this pass.
- **Assigning a role to the owner.** The owner intentionally holds no role and needs none — full access comes from the bypass.
- **Reassigning orphaned users automatically.** A user whose role was deleted stays at null role until an administrator reassigns them; no auto-reassignment or notification.
- **Recipe write-path step visibility.** Filtering applies to reads; create/update responses are not specially filtered beyond existing behavior.
- **Custom or per-record permissions**, permission inheritance, or role hierarchies — the flat catalog model from v2 stands.
- **Backend test framework selection and CI wiring** beyond proposing the seam; adopting a runner is a separate decision.

## Further Notes

- This PRD reverses two positions taken mid-discussion, now settled: (a) roles **are** in the Manage collapse — role write is a grantable `roles.manage` key (not owner-only), guarded by a self-guard that stops a holder from editing or deleting their own assigned role; (b) role deletion is **always allowed** (un-assigning users via SetNull), replacing the earlier "block if assigned to a user" rule.
- Accepted trade-off: a user whose role is deleted is locked out of everything until reassigned. This is preferred over silently retaining elevated access.
- Accepted trade-off: the owner user record is permanent and non-transferable this pass; organizations needing to change owner will require the out-of-scope transfer feature later.
- Publication note: the skill specifies publishing to the project issue tracker with the `ready-for-agent` label, but **no issue tracker / triage-label configuration is present** in this repo (only the skill definition). This PRD is written to `docs/` per the invocation argument; run `/setup-matt-pocock-skills` to enable tracker publishing.
