# S4 — Permission-aware navigation + post-login landing

Source PRD: `docs/prd-rbac-v2.md`

## What to build

Make navigation reflect exactly what the signed-in user may reach. Drive the sidebar from a declarative navigation config pairing each route with its required permission; hide items the user cannot access. After login, redirect the user to the first navigation route (in navigation order) they are allowed to access; if they can access none, redirect to `/no-access`. Guard the dashboard route behind `dashboard.access` (frontend-only enforcement for now).

## Acceptance criteria

- [ ] Navigation items appear only when the user has the matching permission.
- [ ] After login, the user lands on the first navigation route they can access, following navigation order.
- [ ] A user with no accessible routes lands on `/no-access`.
- [ ] The dashboard route is reachable only with `dashboard.access`; otherwise it redirects to `/no-access`.
- [ ] Manually navigating to a forbidden page redirects to `/no-access` rather than showing a broken page or a raw error.

## Blocked by

- S3
