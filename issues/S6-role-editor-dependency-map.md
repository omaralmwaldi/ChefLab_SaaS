# S6 — Role editor with dependency map

Source PRD: `docs/prd-rbac-v2.md`

## What to build

A role-editor UI that renders every toggle from the `GET /permissions` catalog grouped by module, and owns the permission dependency graph so admins cannot create unusable roles. Selecting `create`, `edit`, or `delete` on a module auto-selects and locks that module's `view`; selecting `dashboard.analytics.view` auto-selects `dashboard.access`. The backend stays purely explicit — the dependency logic lives entirely in the editor. Saving a role persists the granted-permissions array.

## Acceptance criteria

- [ ] The editor renders all catalog permissions grouped by module, sourced from `GET /permissions`.
- [ ] Selecting create/edit/delete auto-selects and locks that module's view.
- [ ] Selecting analytics auto-selects dashboard access.
- [ ] Saving persists exactly the granted keys as an array.
- [ ] Viewing/creating/editing/deleting of users, roles, and categories can be toggled independently.

## Blocked by

- S1
- S3
