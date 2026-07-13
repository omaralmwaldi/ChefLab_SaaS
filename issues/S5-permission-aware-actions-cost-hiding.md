# S5 — Permission-aware actions + cost hiding (UI)

Source PRD: `docs/prd-rbac-v2.md`

## What to build

Gate in-page controls by permission so unavailable functionality simply does not appear. Wrap Create, Edit, Delete, and Export buttons, tabs, menu items, and context-menu actions in permission checks so they render only when the matching permission exists. Hide cost columns and cost fields in the UI when the user lacks `costs.view` (the server already omits the data — the UI renders cost only when present and additionally guards with a permission check). Render the dashboard analytics widget only behind `dashboard.analytics.view`.

## Acceptance criteria

- [ ] Create/Edit/Delete/Export controls render only when the user has the corresponding permission.
- [ ] Tabs, menu items, and context-menu actions the user lacks permission for are hidden.
- [ ] Cost columns and fields do not render for a user without `costs.view`.
- [ ] The analytics widget renders only with `dashboard.analytics.view`.
- [ ] No permission-denied errors surface during normal use — unavailable actions are simply absent.

## Blocked by

- S3
- S2
