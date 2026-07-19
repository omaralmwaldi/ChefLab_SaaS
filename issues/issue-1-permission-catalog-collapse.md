# Permission catalog collapse + migration + test harness

**Label:** ready-for-agent
**Source PRD:** `docs/prd-rbac-refinements.md`

## What to build

Collapse the redundant CRUD permission keys into a single **Manage** key per simple module, retire role write keys from the grantable catalog, migrate existing roles, and stand up the test harness the rest of this PRD depends on.

End-to-end behavior:

- The permission catalog (backend single source of truth, mirrored in the frontend constants) replaces `create` / `edit` / `delete` with a single `manage` key for **Ingredients**, **Categories**, and **Users**. Their `view` keys are unchanged. **Recipes** keep granular `create` / `edit` / `delete` / `view`. **Costs** and **Dashboard** keys are unchanged.
- **Roles** lose their write keys from the grantable catalog entirely — no `manage`, no `create/edit/delete`. `roles.view` remains grantable so non-owners can populate the role picker when managing users. (The owner-only enforcement of role writes is a separate slice.)
- Ingredient / Category / User create, edit, and delete routes are re-guarded by the module's `manage` permission. View routes still use the `view` permission. The catalog continues to derive `GET /permissions` and the grouped-by-module response automatically.
- A one-shot data migration rewrites the `permissions` JSON array on every existing role: `{ingredients,categories,users}.{create,edit,delete}` collapse to the matching `.manage` key (de-duplicated); any `roles.create/edit/delete/manage` keys are stripped; `view` and all recipe/cost/dashboard keys are preserved verbatim.
- The frontend Role Editor renders the revised catalog: one **Manage** checkbox for Ingredients/Categories/Users that auto-checks and locks **View** on while set; granular checkboxes for Recipes; the roles module shows **View only**. The Manage↔View pairing is UX only — the backend does not implicitly grant view.
- A test harness is established at the HTTP seam: the Express app mounted in-process and driven over HTTP against a test database, with helpers to mint JWTs for the owner and for role-scoped actors. This harness is reused by all later slices.

## Acceptance criteria

- [ ] `GET /permissions` returns `manage` (not `create/edit/delete`) for ingredients, categories, users; returns `view` only for roles; returns granular keys for recipes; costs/dashboard unchanged.
- [ ] Ingredient/Category/User create, edit, delete endpoints are authorized by the module `manage` permission; a role with only `view` is refused (403) on writes and allowed on reads.
- [ ] Running the migration converts a pre-existing role holding e.g. `users.create/edit/delete` into `users.manage` (single, de-duplicated) and strips any `roles.*` write keys, leaving `view`/recipe/cost/dashboard keys intact.
- [ ] The Role Editor shows a single Manage toggle for the three collapsed modules; checking Manage checks and disables un-checking View; recipes show granular toggles; roles show View only.
- [ ] The HTTP test harness boots the app against a test DB and can mint owner and role-scoped tokens; a smoke test exercising `GET /permissions` passes.

## User stories covered

PRD stories 1, 2, 3, 5, 6, 7, 8, 9.

## Blocked by

None - can start immediately.
