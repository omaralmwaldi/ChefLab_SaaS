# PRD: Granular RBAC v2 (Feature/Action Permissions + Frontend Enforcement)

## Problem Statement

ChefLab's current permission model is too coarse. Every module (Users, Roles, Recipes, Ingredients, Categories) exposes exactly four permissions — `view`, `create`, `edit`, `delete` — stored as a flat `{ "module.action": true }` JSON map on each `Role`. This CRUD-per-module shape cannot express real restaurant operations:

- There is no way to let a user see recipes but **not** their cost figures. Cost is a sensitive business number (`totalCost` on a recipe, `usageUnitCost` per recipe-ingredient, `costPerStorageUnit` on ingredients), and today anyone with `recipes.view` sees it.
- There is no notion of feature or page permissions that are not CRUD — e.g. accessing a Dashboard or viewing analytics.
- The organization owner is governed by the same RBAC as everyone else, so their full access depends on a role being configured correctly and can be accidentally revoked.

On the frontend, there is **no permission awareness at all**. The SPA does not hide navigation items, buttons, tabs, menus, or sensitive fields based on what the signed-in user may do, and there is no route guard — a user who lacks access to a page either sees a broken UI or hits raw backend `403` errors during normal use. Permissions are only read once at login and never refreshed, so a role change requires the user to log out and back in.

---

## Solution

Evolve the permission system into a **feature/action-based model** with a growing catalog of granular permission keys, backed by a single source of truth the frontend can consume. Permissions separate viewing from editing, separate ordinary data from sensitive cost data, and support non-CRUD feature permissions (dashboard access, analytics).

The backend remains the sole security boundary: every route is guarded by permission middleware, cost fields are stripped from responses when the user lacks the cost permission, and writes preserve cost values a user is not allowed to see. The **organization owner sits entirely outside RBAC** — identified only by `Organization.ownerUserId`, holding no role, and bypassing all permission checks.

The frontend becomes fully permission-aware for **user experience only** (never as a security mechanism). A permission context loads the current user's permissions from `/auth/me` on app initialization and session restoration, so role changes take effect without re-login. Navigation items, buttons, tabs, menu items, context actions, and sensitive fields render only when the required permission exists. Route guards redirect users who manually navigate to a forbidden page to a dedicated "no access" screen instead of showing a broken UI or backend errors. After login, users land on the first navigation route they are allowed to access.

---

## User Stories

### Permission model & catalog
1. As an organization administrator, I want to grant permissions at the level of individual features and actions, so that I can model real kitchen roles rather than blanket CRUD access.
2. As an administrator building a role, I want a complete catalog of every available permission grouped by module, so that I can see and toggle every capability in one place.
3. As an administrator, I want new permissions added to the system to default to "denied" for existing roles, so that a system update never silently grants access no one intended.
4. As a developer, I want the permission catalog served from a single backend endpoint, so that the frontend never drifts from the backend's definition of what permissions exist.

### Viewing vs editing vs cost data
5. As an administrator, I want to give a user permission to view recipes (list and detail together) without permission to create, edit, or delete them, so that line cooks can read recipes but not change them.
6. As an administrator, I want to give a user permission to view ingredients without editing them, so that staff can reference stock items without altering data.
7. As an administrator, I want a single "view costs" permission that governs all cost figures across the whole system, so that I can hide pricing from staff regardless of which screen they are on.
8. As a line cook without the cost permission, I want cost fields to simply not appear on recipes and ingredients, so that I am never exposed to sensitive pricing.
9. As an administrator, I want a user who can edit a recipe but cannot view costs to be unable to accidentally erase cost data when they save, so that editing a recipe never destroys pricing they never saw.
10. As an administrator, I want granting create, edit, or delete on a module to automatically include view on that module, so that I never create a role that can edit a record it cannot open.

### Feature/non-CRUD permissions
11. As an administrator, I want a permission that controls whether a user can access the dashboard page, so that only relevant staff see it.
12. As an administrator, I want a separate permission that controls whether a user can view analytics on the dashboard, so that I can grant dashboard access without exposing analytics.
13. As an administrator, I want password resets to be part of the "edit users" permission, so that anyone allowed to manage users can reset a password without a separate grant.

### Users, Roles, Categories management
14. As an administrator, I want to control viewing, creating, editing, and deleting of users independently, so that I can delegate onboarding without granting deletion.
15. As an administrator, I want to control viewing, creating, editing, and deleting of roles independently, so that I can let a manager review roles without letting them change permissions.
16. As an administrator, I want to control viewing, creating, editing, and deleting of categories independently, so that menu structure changes are limited to authorized staff.

### Organization owner
17. As the person who created the organization, I want inherent full access to everything that cannot be modified or removed through role management, so that I never lock myself out by misconfiguring a role.
18. As the organization owner, I want to have no assigned role and to bypass every permission check, so that my access is not coupled to RBAC at all.
19. As an administrator, I want every other user in the organization to be governed by RBAC, so that only the owner is exempt.

### Frontend enforcement
20. As a user, I want to see only the navigation items for pages I can access, so that the app never offers me a door I cannot open.
21. As a user, I want Create, Edit, Delete, and Export buttons to appear only when I have the matching permission, so that I am not tempted by actions that would fail.
22. As a user, I want tabs, menu items, and context-menu actions I lack permission for to be hidden, so that the interface reflects exactly what I can do.
23. As a user without the cost permission, I want cost columns and cost fields to be absent from the UI, so that pricing is never shown to me.
24. As a user, I want to be redirected to a clear "no access" screen if I manually navigate to a page I lack permission for, so that I never see a broken page or a raw error.
25. As a user, I want the app to avoid showing permission errors during normal use, so that unavailable functionality simply does not appear rather than failing loudly.
26. As a user whose role was just changed by an administrator, I want the change to take effect when I reload or my session is restored, so that I do not have to log out and back in.
27. As a user, I want to land on the first page I am allowed to access immediately after logging in, so that I am never dropped onto a page I cannot use.
28. As a user with no page permissions at all, I want to be shown a "no access" screen after login, so that I get a clear message instead of a blank or broken app.
29. As a developer, I want a single permission-check helper and a declarative component/guard for gating UI, so that adding new permission-gated features is consistent and low-effort.

### Backend enforcement (security boundary)
30. As a security-conscious operator, I want the backend to enforce every permission regardless of what the frontend does, so that hiding a button is never mistaken for security.
31. As a security-conscious operator, I want every API route scoped by organization and guarded by the required permission, so that no tenant can reach another tenant's data or an action they lack.
32. As a security-conscious operator, I want cost fields stripped from API responses when the caller lacks the cost permission, so that the data never leaves the server in the first place.

---

## Implementation Decisions

### Permission catalog (final keys)
The system defines a growing but centrally-declared catalog. Standard module permissions keep their existing **two-part** grammar (`resource.action`) so existing keys are unchanged. Feature/field permissions use a **three-part** grammar (`resource.subject.action`).

```
users.view        users.create        users.edit        users.delete
roles.view        roles.create        roles.edit        roles.delete
recipes.view      recipes.create      recipes.edit      recipes.delete
ingredients.view  ingredients.create  ingredients.edit  ingredients.delete
categories.view   categories.create   categories.edit   categories.delete
costs.view                              # single global cost permission
dashboard.access                        # feature permission (frontend-only for now)
dashboard.analytics.view                # feature permission (frontend-only for now)
```

- `recipes.view` (and every `*.view`) means **list + detail + page access** as one permission — browsing and viewing a single record are the same workflow, and for list-style modules `*.view` also implies the ability to open that page. There is no separate list/detail or page-access permission.
- `costs.view` is a **single system-wide** cost permission. It is not split per module. When absent, all cost figures are hidden everywhere.
- Password reset is covered by `users.edit`. There is no separate reset permission or endpoint.
- `dashboard.access` and `dashboard.analytics.view` are enforced on the **frontend only** for now (route guard + navigation + widget visibility), because no dashboard/analytics API exists yet. They will be enforced on the backend once those APIs are built.

### Storage model change
- `Role.permissions` changes from a `{ key: true }` map to a **JSON array of granted permission keys** (`string[]`). Absence from the array means denied. `false` values are no longer stored.

### Permission dependencies (enforced in the role-editor UI)
The backend stays purely explicit — it does not infer permissions. To prevent unusable roles (e.g. can edit but cannot open the record), the role-editor UI owns a dependency map and auto-selects and locks prerequisites:
- Selecting `create`, `edit`, or `delete` on a module auto-selects and locks that module's `view`.
- Selecting `dashboard.analytics.view` auto-selects `dashboard.access`.

### Organization owner (outside RBAC)
- New column `Organization.ownerUserId` referencing a `User`. This is the sole identifier of the owner.
- The owner has **no `roleId`** and **bypasses all RBAC** — permission middleware, the cost serializer, and frontend permission checks all treat the owner as fully authorized.
- Ownership transfer is out of scope; a single fixed owner per organization for now.

### Backend contracts
- **Permission helper:** a single `hasPermission(req, key)` returns `true` if the request belongs to the organization owner, otherwise whether the role's granted-permissions array includes `key`. All enforcement funnels through this helper.
- **`requirePermission(key)` middleware:** unchanged call sites; internally short-circuits for the owner, then checks the granted array. Continues to load the role scoped by `(id, organizationId)`. Returns `403` on failure. Reads permissions fresh from the database per request, so the backend is never stale.
- **Cost serializer:** when the caller lacks `costs.view` (and is not the owner), cost fields are **omitted** (not `403`) from responses:
  - Recipe responses: strip `totalCost` and every recipe-ingredient `usageUnitCost`.
  - Ingredient responses: strip `costPerStorageUnit` and `usageUnitCost`.
  - Inside a recipe response, the embedded recipe-ingredient `usageUnitCost` is governed by the single `costs.view` permission.
- **Cost write-guard:** on recipe and ingredient updates, if the caller lacks `costs.view`, incoming cost fields are ignored and the stored values are preserved — an edit by a cost-blind user never nulls or alters pricing. Because recipe cost is derived from stored `RecipeIngredient.usageUnitCost`, the guard protects the underlying stored inputs, not just the derived total.
- **Catalog endpoint:** `GET /permissions` returns the full catalog grouped by module — the single source of truth the role-editor renders from.
- **`GET /auth/me`:** returns the current user together with their role and granted-permissions array, read fresh from the database, so the frontend can refresh permissions without re-login.

### Frontend architecture
- **Permission context:** on app initialization and session restoration, call `/auth/me` and store the user's granted permissions as a `Set<string>` plus an `isOwner` flag. This is the freshness mechanism — no WebSockets or real-time updates.
- **`usePermissions()` hook** exposing `can(key)` = `isOwner || set.has(key)`.
- **`<Can permission="...">` component** that renders its children only when `can(key)` is true — used to gate buttons, tabs, menu items, context-menu actions, and sensitive fields.
- **`<ProtectedRoute permission="...">` guard** that redirects to `/no-access` when the required permission is absent.
- **Navigation config** as a declarative array of `{ path, permission }`; the sidebar filters items by `can()`.
- **Post-login landing:** redirect to the first navigation route (in navigation order) the user can access; if the user can access none, redirect to `/no-access`.
- **Cost fields:** the server already strips them, so the UI renders cost fields only when present; `<Can permission="costs.view">` is used as an additional guard.
- **Permission constants file** on the frontend mirrors the catalog keys as string literals for use in `can()` checks; the backend `GET /permissions` endpoint remains the authoritative catalog.

### Data migration
- Add `Organization.ownerUserId`. For each existing organization, set the owner to the earliest-created user holding an administrator-type role, falling back to the earliest-created user in the organization. (Assumed default — confirm before running.) The chosen owner's `roleId` is cleared.
- Convert each role's `permissions` from `{ key: true }` map to an array of the keys whose value was `true`.
- Existing two-part keys are preserved verbatim; `costs.view`, `dashboard.access`, and `dashboard.analytics.view` are **not** added to existing roles (default denied).

---

## Testing Decisions

Good tests assert **external behavior** at the highest seam, not internal structure. They exercise the permission decision through the API and through the `can()` helper, and they must survive refactors of how permissions are stored or checked internally.

- **Primary backend seam — the API endpoints.** For each guarded route, test that a role with the permission gets `200` and a role without it gets `403`, scoped by organization. This is the same style of endpoint-level testing used for the bilingual work (assert on the response of a real request, e.g. `GET /auth/me`).
- **Cost serializer behavior — via API.** With `costs.view` granted, recipe and ingredient responses include cost fields; without it, `totalCost`, `usageUnitCost`, and `costPerStorageUnit` are absent. Assert on the response body shape, not on the serializer internals.
- **Cost write-guard behavior — via API.** A user lacking `costs.view` who updates a recipe/ingredient leaves the stored cost values unchanged (verified by re-reading as a cost-permitted user or the owner).
- **Owner bypass — via API.** A request as the organization owner (no role) succeeds on every guarded route and always receives cost fields.
- **Catalog endpoint — via API.** `GET /permissions` returns every catalog key grouped by module.
- **Frontend permission helper — the `can()` seam.** Unit-test `can(key)` as a pure function over a permission set + `isOwner` flag: owner always true; granted key true; absent key false. This mirrors the "pure helper" testing seam used for the bilingual `pick()` helper.
- **Frontend gating — component/route level.** `<Can>` renders/hides children per permission; `<ProtectedRoute>` redirects to `/no-access` when the permission is absent; navigation filters hidden items; post-login lands on the first accessible route.

Modules tested: auth (`/auth/me`), the new `/permissions` catalog, and every guarded module (users, roles, recipes, ingredients, categories) for both route-level and cost-level behavior; plus the frontend permission context, `can()` helper, `<Can>`, and `<ProtectedRoute>`.

---

## Out of Scope

- Backend enforcement of `dashboard.access` and `dashboard.analytics.view` (no dashboard/analytics API exists yet — frontend-only for now).
- Ownership transfer between users.
- Real-time permission updates (WebSockets / push). Freshness is limited to app initialization and session restoration via `/auth/me`.
- Wildcard permissions (e.g. `recipes.*`) for tenant roles — not needed because the owner is outside RBAC and new permissions default to denied.
- Per-module cost permissions — a single system-wide `costs.view` is used deliberately.
- A separate list/detail split or a separate page-access permission — `*.view` covers both.
- A separate password-reset permission or endpoint — folded into `users.edit`.
- Field-level permissions beyond cost data.

---

## Further Notes

- The current `permission.middleware.js` is already implemented (contrary to the note in `CLAUDE.md`, which is stale) and already guards every route via `requirePermission(PERMISSIONS.X)`. This PRD extends that mechanism rather than introducing it: add the owner short-circuit, the `costs.view` serializer and write-guard, the array-based storage, the `/permissions` catalog, and the enriched `/auth/me`.
- All existing multi-tenancy invariants hold: every query stays scoped by `organizationId` from the JWT, and role lookups remain scoped by `(id, organizationId)`.
- The frontend is currently a bare Vite scaffold, so the permission context, hook, `<Can>`, `<ProtectedRoute>`, navigation config, and `/no-access` screen are net-new and can be built to this architecture from the start.
- Frontend checks are strictly for user experience. The backend is the only security boundary; hiding UI must never be relied upon to protect data or actions.
