# S3 — Frontend permission core

Source PRD: `docs/prd-rbac-v2.md`

## What to build

The reusable frontend permission layer. A permission context loads the current user from `/auth/me` on app initialization and session restoration, storing granted permissions as a set plus an `isOwner` flag — this is the freshness mechanism (no realtime/WebSockets). Expose a `usePermissions()` hook with `can(key)` = `isOwner || set.has(key)`. Provide a declarative `<Can permission="...">` component that renders its children only when allowed, a `<ProtectedRoute permission="...">` guard that redirects to a dedicated `/no-access` screen when the permission is absent, and a frontend constants file mirroring the catalog keys for use in checks.

## Acceptance criteria

- [ ] On app init and session restoration, the context calls `/auth/me` and stores the granted-permission set and `isOwner`.
- [ ] A role change made by an admin takes effect on the user's next reload/session restore without logging out and back in.
- [ ] `can(key)` returns true for the owner on any key, true for a granted key, false otherwise.
- [ ] `<Can>` renders children only when the permission is present.
- [ ] `<ProtectedRoute>` redirects to `/no-access` when the required permission is absent.
- [ ] A `/no-access` screen exists and renders a clear message.
- [ ] A frontend constants file lists the catalog keys used in checks.

## Blocked by

- S0
