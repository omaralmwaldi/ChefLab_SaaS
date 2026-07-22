# PRD: Recipe List Filter Modal

## Problem Statement

Restaurant and café staff using ChefLab accumulate large recipe catalogues over time. The recipe
list page loads every recipe for the organization at once and offers no way to narrow the view. A
chef looking for "all chiller recipes in the Sauces category authored by a specific cook" must scan
the entire table by eye. The backend already supports category, status, and a combined name/SKU
search, but the frontend never sends those parameters — the list is effectively unfilterable, and
two useful dimensions (author and shelf-life unit) are not filterable at all, even server-side.

## Solution

Add a **Filter** button to the recipe list toolbar that opens a filter modal. The modal collects all
filter criteria and applies them together on demand, refetching the list from the server:

1. **Name search** — one bilingual text box matching the English *or* Arabic recipe name.
2. **SKU search** — a separate text box matching the SKU.
3. **Category** — multi-select; a recipe matches if it belongs to *any* chosen category.
4. **Status** — single-select (Draft / Closed / any).
5. **Created by** — single-select dropdown listing only users who have actually authored a recipe.
6. **Shelf-life unit** — multi-select (Hour / Day / Week / Month); matches *any* chosen unit.

Filters combine with AND across dimensions. The user tunes everything in the modal and presses
**Apply** to run a single refetch; **Reset** clears every field. The Filter button shows a badge with
the count of active filters so the current filtered state is visible without opening the modal.

## User Stories

1. As a chef, I want to open a filter modal from the recipe list, so that I can narrow a large
   catalogue instead of scrolling.
2. As a chef, I want to search recipes by English or Arabic name in one box, so that I find a recipe
   regardless of which language I remember it in.
3. As a chef, I want a separate SKU search box, so that I can look a recipe up precisely by its code
   without name matches getting in the way.
4. As a chef, I want to filter by one or more categories at once, so that I can review a related group
   of recipes together.
5. As a chef, I want to filter by status, so that I can see only drafts I still need to finish or only
   closed recipes in production.
6. As a manager, I want to filter recipes by the person who created them, so that I can review a
   particular cook's contributions.
7. As a manager, I want the "created by" dropdown to list only real recipe authors, so that I never
   pick a user who has no recipes and get an empty result.
8. As a chef, I want to filter by one or more shelf-life units, so that I can find, for example, all
   short-lived (hour/day) preparations at once.
9. As a chef, I want all my filter choices to combine, so that I can express a precise query like
   "chiller sauces authored by Sara that are still drafts".
10. As a chef, I want to set several filters and apply them together in one step, so that the list does
    not refetch repeatedly while I am still choosing.
11. As a chef, I want a Reset control, so that I can clear all filters and return to the full list in
    one action.
12. As a chef, I want to cancel the modal without applying, so that changes I was experimenting with
    are discarded.
13. As a chef, I want a badge showing how many filters are active, so that I can tell at a glance that
    the list I am looking at is filtered.
14. As a chef, I want the applied filters to persist while I browse the filtered list, so that opening
    and returning from a recipe does not silently reset my view.
15. As an Arabic-speaking user, I want every filter label and control in the modal localized, so that
    the feature reads naturally in my language and layout direction.
16. As a chef, I want an empty filtered result to be clearly communicated, so that I understand the
    list is empty because of my filters, not because of an error.
17. As a user without cost-view permission, I want filtering to work unchanged, so that narrowing the
    list never exposes cost data I am not permitted to see.
18. As a chef, I want category and shelf-life-unit options in the modal to reflect my organization's
    real data, so that I am not offered options that cannot match anything.

## Implementation Decisions

**Filtering runs server-side.** The list page sends filter criteria as query parameters to
`GET /recipes` and refetches on Apply. This keeps the door open for pagination and scales past the
current "load everything" approach.

**Backend — recipe list filter (extend the existing `getAllRecipes` service and its controller):**

- `q` — matches `nameEn` OR `nameAr` (case-insensitive substring). **Behavior change:** `q` no longer
  matches SKU; SKU moves to its own parameter. The recipe list is the only caller of this parameter.
- `sku` — new parameter, case-insensitive substring match on `sku`.
- `categoryId` — accepts multiple values, translated to an `IN` match.
- `shelfLifeUnit` — new parameter, accepts multiple values, `IN` match against the `ShelfLifeUnit`
  enum (`HOUR`, `DAY`, `WEEK`, `MONTH`).
- `status` — single value, equality match (existing behavior).
- `createdBy` — new parameter, single user id, equality match.
- All dimensions combine with AND. Every query stays scoped by `organizationId` from the JWT, per the
  multi-tenancy convention.

**Multi-value transport.** Array-valued parameters (`categoryId`, `shelfLifeUnit`) are sent as a
single comma-separated string and split back into an array in the controller. This avoids
bracket-notation ambiguity between the HTTP client and Express 5's read-only `req.query`. The service
layer normalizes single-value / array / comma inputs defensively.

**Backend — recipe authors endpoint (new):** `GET /recipes/authors`, guarded by the same
`recipes.view` permission as the list, mounted before the `/:id` route. Returns the distinct set of
users referenced by `createdBy` across the organization's recipes as `{ id, name }`, ordered by name.
Users deleted after authoring simply do not appear (no matching user row). This backs the modal's
"created by" dropdown so it lists real authors only.

**Frontend — recipes API client:** extend the list call to pass `q`, `sku`, `categoryId[]`, `status`,
`createdBy`, `shelfLifeUnit[]`, and add a call for the authors endpoint. Categories are loaded via the
existing `/categories` endpoint, matching how the recipe create/edit modal already populates its
category select.

**Frontend — filter modal (new component):** follows the existing recipe modal's overlay and control
styling. Loads categories and authors on open. Local state holds all six criteria; **Apply** invokes
an `onApply(filters)` callback with the assembled criteria, **Reset** clears local state, **Cancel**
closes without applying. Category and shelf-life-unit use multi-select controls; status and
created-by use single-select.

**Frontend — recipe list page:** owns the applied-filter state, renders the Filter button with an
active-filter count badge, and refetches through the extended API client whenever filters are applied.
Active-filter count = number of non-empty scalar criteria plus the length of each multi-select array.

**Localization.** New labels (filter, apply, reset, name search, SKU search, status, created by, any
author, all, shelf-life unit, active-filter count) added to both the English and Arabic `recipes`
translation namespaces. Enum option labels reuse the existing shelf-life and status translation keys.

## Testing Decisions

Good tests here exercise **external behavior at the HTTP boundary**, not the internal shape of the
Prisma `where` clause. A test should assert "given these query parameters, these recipes come back (and
these do not)", never "the service built this object".

**Primary seam — `GET /recipes`.** This single endpoint is the highest-value seam and should carry the
bulk of coverage:

- name search matches English and Arabic names but not SKU
- SKU search matches SKU independently of name search
- multi-value category returns recipes in any listed category
- multi-value shelf-life unit returns recipes with any listed unit
- status and created-by narrow by equality
- combined filters intersect (AND) correctly
- every filter stays scoped to the caller's organization (a recipe in another org is never returned)
- no parameters returns the full org list (regression guard on the `q` behavior change)

**Secondary seam — `GET /recipes/authors`:** returns exactly the distinct authors of the org's
recipes, excludes authors from other organizations, and omits deleted users.

**Prior art / caveat.** The backend currently has no test script or test suite (per project docs). If
tests are introduced, they should run against the real controller→service→Prisma stack (integration
level, against a test database) rather than mocking Prisma, since the value of these tests is verifying
the query semantics end to end. Establishing that harness is a prerequisite noted below.

## Out of Scope

- Pagination, infinite scroll, or server-side sorting of the recipe list.
- Persisting filter state across sessions or encoding it in the URL / query string (state lives in
  page memory for the current visit only).
- Saved / named filter presets.
- Filtering by ingredients, sub-recipes, cost range, yield, storage location (`shelfLifePlace`), or
  free-text notes.
- Multi-select for status or created-by (both remain single-select by decision).
- Any change to how cost visibility is serialized; filtering must not alter existing cost-permission
  behavior.
- Standing up the backend test harness itself (tracked separately); this PRD specifies what to test,
  not the introduction of the test runner.

## Further Notes

- The `q` parameter's meaning narrows from "name or SKU" to "name only". The recipe list is its sole
  consumer, so no other screen is affected, but this is a deliberate contract change worth calling out
  in review.
- The created-by dropdown intentionally lists authors rather than all organization members, so it can
  be built without a general users-listing endpoint and never offers an author with zero recipes.
- Comma-separated multi-value transport was chosen over repeated keys / bracket notation specifically
  because Express 5 exposes `req.query` as a read-only getter and array parsing differs from Express 4;
  the comma format keeps controller parsing explicit and framework-agnostic.
