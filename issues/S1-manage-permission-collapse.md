# S1 — Manage-permission collapse + Roles manage & self-guard

Source PRD: `docs/prd-rbac-refinements.md`

## What to build

Collapse the per-action `create` / `edit` / `delete` keys into a single `manage` key for **Ingredients**, **Categories**, **Users**, and **Roles**, end to end. The permission catalog (backend source of truth, mirrored in the frontend constants) exposes `{module}.manage` plus the unchanged `{module}.view` for these four modules; `Recipes` keeps its granular create/edit/delete/view; costs and dashboard keys are untouched. `GET /permissions` and the grouped-by-module catalog surface the collapsed keys automatically with no extra wiring.

Re-guard the write routes of Ingredients, Categories, Users, and Roles with the module's `manage` key instead of the retired per-action keys; view routes keep the view key. `roles.manage` is a normal grantable permission (not owner-only), with a **self-guard** enforced in the Role service: a `roles.manage` holder may not edit or delete the role assigned to their own account (refused with 403). The owner bypasses the self-guard via the existing `isOwner` short-circuit and holds no role.

Ship a one-shot data migration that rewrites every existing `Role.permissions` array: `{ingredients,categories,users,roles}.{create,edit,delete}` collapse to the corresponding `.manage` key (de-duplicated); `view` and all recipe/cost/dashboard keys preserved verbatim, so no role silently gains or loses access.

The Role Editor renders a single **Manage** checkbox for Ingredients/Categories/Users/Roles and granular checkboxes for Recipes. Selecting Manage auto-checks View and disables un-checking it while Manage is set (UX pairing only; backend does not implicitly grant View).

## Acceptance criteria

- [ ] `GET /permissions` returns `{ingredients,categories,users,roles}.manage` and their `.view` keys; the retired `create`/`edit`/`delete` keys for those modules are absent. Recipes still expose granular keys.
- [ ] Backend and frontend permission constants are in sync (same collapsed catalog).
- [ ] Ingredient/Category/User/Role write routes return `200` for a holder of the module's `manage` key and `403` for a user without it; view routes still gated by `view`.
- [ ] A `roles.manage` holder can create, edit, and delete any role except the one assigned to their own account (edit/delete of own role → `403`); any other role succeeds. The owner is unaffected.
- [ ] `roles.view` alone (no `manage`) still lets a user list roles to populate the role picker.
- [ ] The migration converts every existing role's permission array to the collapsed form without adding or removing effective access.
- [ ] Role Editor shows one Manage checkbox per collapsed module; selecting Manage auto-selects and locks View; Recipes remain granular.

## Blocked by

- None — can start immediately.
