# PRD: Dashboard Cost Charts + Shelf-Life Card

## Problem Statement

Restaurant and café managers using ChefLab record cost data on recipes and ingredients, but the
dashboard surfaces almost none of it. The only analytics widget is a single "Recipe Cost Ranking"
chart showing the top-5 recipes by total cost. A manager who wants to answer "which of my per-kilo
recipes cost the most to produce?", "what are my priciest ingredients?", or "how is my recipe
catalogue distributed across storage locations?" has no way to do so without opening records one by
one. Cost and shelf-life data exist but are not decision-ready.

## Solution

Replace the single ranking chart with two cost charts plus one distribution card in the dashboard
analytics section:

1. **Top-10 cost recipes** — the ten most expensive closed recipes by cost per storage unit, with a
   storage-unit filter so managers compare like with like. Replaces the existing top-5 chart.
2. **Top-10 cost ingredients** — the ten most expensive ingredients by cost per storage unit, with a
   storage-unit filter.
3. **Recipes per shelf-life place card** — a count of recipes broken down across the three shelf-life
   places (room temperature, chiller, freezer).

Storage-unit dropdowns list only the distinct units present in each chart's data (not free text) and
include an "All" option.

## User Stories

1. As a café manager, I want to see my ten most expensive recipes, so that I can target them for
   cost reduction.
2. As a café manager, I want recipes ranked by cost per storage unit rather than total cost, so that
   recipes of different yield sizes are compared fairly.
3. As a café manager, I want to filter the recipe cost chart by storage unit, so that I only compare
   recipes measured on the same basis.
4. As a café manager, I want an "All" option on the recipe chart, so that I can see the global top-10
   across every unit.
5. As a café manager, I want the storage-unit filter to list only units present in my data, so that I
   never pick an empty option.
6. As a café manager, I want closed recipes only in the recipe cost chart, so that unfinished drafts
   do not distort the ranking.
7. As a café manager, I want to see my ten most expensive ingredients, so that I can watch my
   highest-cost inputs.
8. As a café manager, I want to filter the ingredient chart by storage unit, so that I can focus on a
   specific class of ingredient.
9. As a café manager, I want a card counting recipes per shelf-life place, so that I understand how my
   catalogue is distributed across room-temperature, chiller, and freezer storage.
10. As a café manager, I want the shelf-life card to count all recipes, so that the distribution
    reflects my complete catalogue, not just closed items.
11. As a café manager, I want each chart to show an empty-state message when no data matches, so that
    a filter selection returning nothing is not confusing.
12. As an Arabic-speaking manager, I want all titles, labels, filter options, and shelf-life place
    names translated and laid out right-to-left, so that the dashboard reads naturally.
13. As a manager without cost-view permission, I want cost charts to omit records I cannot cost, so
    that the dashboard degrades gracefully.
14. As a manager without analytics permission, I want the cost section hidden entirely, so that the
    dashboard reflects my access level.
15. As a café manager, I want to switch a filter and see the chart re-rank instantly, so that
    exploration feels responsive.
16. As a café manager, I want costs shown in SAR consistent with the rest of the dashboard, so that
    figures are unambiguous.

## Implementation Decisions

- **Scope: frontend only.** No backend, Prisma, or schema changes. The existing `GET /recipes` and
  `GET /ingredients` endpoints already return every needed field: recipes carry `storageUnit`,
  `status`, `shelfLifePlace`, and derived `costPerStorageUnit`; ingredients carry `storageUnit` and
  `costPerStorageUnit`.
- **Single module touched:** the dashboard page component, plus the two locale resource files. The
  page already fetches `/recipes` and `/ingredients`; it will retain the full ingredient list rather
  than only its count.
- **Cost metric:** `costPerStorageUnit` for both charts. Recipe `costPerStorageUnit` is derived (total
  cost / yield quantity × conversion factor) and cannot be produced by a SQL `groupBy`, so client-side
  aggregation is used and no aggregation endpoint is added.
- **Recipe cost chart scope:** closed recipes only (`status === "CLOSED"`), storage-unit filter
  applied, sorted descending by `costPerStorageUnit`, capped at 10.
- **Ingredient cost chart scope:** all ingredients (no status), null-cost rows dropped, storage-unit
  filter applied, sorted descending, capped at 10.
- **Shelf-life card:** groups **all** recipes by `shelfLifePlace` into the three fixed buckets
  (ROOM_TEMPERATURE, CHILLER, FREEZER) and renders a count per bucket. It is a structural count, so it
  is not restricted to closed recipes.
- **Storage-unit filter options:** derived from the distinct `storageUnit` values in each chart's own
  data set (recipe chart from closed recipes; ingredient chart from ingredients), sorted, plus "All".
  Not free-text entry.
- **Replacement:** the new top-10 recipe chart replaces the existing top-5 total-cost chart.
- **Permission gating:** the whole section stays behind the existing analytics-view permission gate.
- **Localization:** new keys in the dashboard namespace (EN + AR), including shelf-life place labels;
  existing right-to-left margin/tick handling reused.
- **Currency:** SAR, hardcoded, matching the current chart.

## Testing Decisions

- **What makes a good test here:** assert observable dashboard behavior — which recipes/ingredients
  appear and in what order, that drafts are excluded from the recipe cost chart, that a filter
  narrows the set, that the shelf-life counts match the recipe fixtures, and that empty states show —
  rather than internal derivation helpers or component internals.
- **Primary seam:** the dashboard page component driven through its two data sources. The highest seam
  is the rendered dashboard with `/recipes` and `/ingredients` responses stubbed; tests feed
  representative fixtures (mixed statuses, mixed storage units, varying costs, all three shelf-life
  places) and assert rendered bars, ordering, filter options, card counts, and empty states. This is a
  single seam and is preferred over testing each chart's aggregation in isolation.
- **Prior art:** the project currently has no automated test runner (no backend test script; frontend
  runs ESLint only). Adding a component test harness is a prerequisite for automated coverage; absent
  that, verification is manual (see Further Notes). Confirm this with the developer before writing
  tests.
- **Modules under test:** the dashboard page component only.

## Out of Scope

- Any backend, Prisma, or schema change.
- New API or aggregation endpoints.
- A same-basis "recipe cost within one selected unit" chart (previously considered, now dropped).
- Breaking the shelf-life card down by `shelfLifeUnit` or exact duration (only `shelfLifePlace`).
- Dashboard summary stat cards (recipe/user/ingredient counts) — the code computes but never renders
  these; that pre-existing gap is untouched.
- Draft recipes in the recipe cost chart (they remain in the shelf-life card).
- Cross-entity / global storage-unit lists (each chart's options stay scoped to its own data).
- Currency selection / per-organization currency; chart-type changes (bar charts retained).
- Introducing an automated test framework, unless separately agreed.

## Further Notes

- Users lacking cost-view permission receive null ingredient costs; those rows are excluded so charts
  still render.
- Manual verification: run the frontend dev server, log in with analytics-view and cost-view
  permissions, open the dashboard, confirm the two charts and the shelf-life card render with the old
  top-5 chart gone; switch each filter and confirm re-ranking; confirm card counts sum to the total
  recipe count; create a draft recipe and confirm it is absent from the recipe chart but still counted
  in the card; switch to Arabic and confirm translated labels and right-to-left layout; run the linter
  clean.
- The implementation plan with concrete integration points lives at
  `~/.claude/plans/rustling-spinning-rose.md`.
