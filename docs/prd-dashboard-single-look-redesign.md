# PRD: Dashboard Single-Look Redesign (shadcn)

## Problem Statement

A restaurant or café owner opening the ChefLab dashboard cannot grasp the state of their kitchen in
one look. The page has grown into a long vertical scroll: three count cards, two full-height (400px)
cost charts, and a shelf-life list stacked one after another. Nothing is prioritised for an
owner-manager whose first question is about money — "what is my most expensive recipe right now?" —
and the visual language is hand-rolled and inconsistent. The owner must scroll and hunt rather than
glance and know.

## Solution

Rebuild the dashboard so an owner-manager reads the most important facts on roughly one screen,
using shadcn/ui components for a cleaner, consistent visual language while keeping the existing
brand palette (orange accent, stone neutrals).

1. **Hero metric — priciest recipe (per unit).** A large, prominent callout at the top of the page
   showing the single most expensive closed recipe within a selected storage unit, in SAR, with the
   unit clearly labelled. A small unit selector on the hero lets the owner switch the basis of
   comparison; it defaults to the first available unit. Ranking within one unit keeps the comparison
   honest (a per-kilo recipe is never ranked against a per-piece one).
2. **Count cards, tightened.** The existing recipe / user / ingredient count cards are re-rendered as
   shadcn cards with reduced padding so they occupy less vertical space, permission-gated exactly as
   today.
3. **The two cost charts, kept but compacted.** The top-10 recipe-cost and top-10 ingredient-cost
   bar charts remain with their data and behaviour unchanged, but are re-rendered through the shadcn
   chart wrapper at a reduced height (~220px) so both fit within a single-look layout. Each chart
   keeps its own independent storage-unit filter (no shared/global filter).
4. **Shelf-life card, restyled.** The recipes-per-shelf-life-place breakdown is kept and re-rendered
   in shadcn style (compact badges/rows), unchanged in data.

The net effect: hero + cards + compacted charts + shelf-life card read as one coherent screen rather
than a long scroll.

## User Stories

1. As an owner-manager, I want the single most expensive recipe called out prominently at the top of
   the dashboard, so that my most important cost fact is the first thing I see.
2. As an owner-manager, I want the priciest-recipe hero to compare recipes only within one storage
   unit, so that a per-kilo recipe is never falsely ranked above a per-piece one.
3. As an owner-manager, I want a small unit selector on the hero metric, so that I can switch which
   storage unit the "most expensive" comparison is based on.
4. As an owner-manager, I want the hero to default to the first available storage unit, so that it
   shows a meaningful figure without me configuring anything.
5. As an owner-manager, I want the hero cost shown in SAR with the storage unit labelled, so that the
   figure is unambiguous.
6. As an owner-manager, I want the recipe / user / ingredient counts kept but more compact, so that
   they inform me without dominating the screen.
7. As an owner-manager, I want both cost charts retained but shorter, so that I can still see the
   rankings while keeping the whole dashboard close to one screen.
8. As an owner-manager, I want each cost chart to keep its own storage-unit filter, so that I can
   scope the recipe and ingredient rankings independently.
9. As an owner-manager, I want the shelf-life place breakdown kept but restyled, so that I retain the
   operational distribution signal in a tidier form.
10. As an owner-manager, I want a cleaner, consistent visual language across the dashboard, so that
    the page looks intentional rather than hand-assembled.
11. As an owner-manager, I want the dashboard to keep the existing orange-and-stone brand colours, so
    that it stays consistent with the rest of the app.
12. As an owner-manager, I want the redesigned dashboard to read on roughly one screen, so that I can
    understand my kitchen's state at a glance without scrolling and hunting.
13. As an Arabic-speaking owner, I want the hero, its unit selector, and all restyled widgets
    translated and laid out right-to-left, so that the dashboard reads naturally.
14. As a manager without analytics permission, I want the cost charts and hero cost widget hidden as
    they are today, so that the dashboard still reflects my access level.
15. As a manager without cost-view permission, I want cost-dependent widgets to degrade gracefully
    (null-cost rows excluded), so that the dashboard still renders.
16. As an owner-manager, I want an empty state on the hero when no closed recipes exist for the
    selected unit, so that an empty selection is not confusing.
17. As an owner-manager, I want the charts and hero to re-rank instantly when I change a filter or the
    hero unit, so that exploration feels responsive.

## Implementation Decisions

- **Scope: frontend only.** No backend, Prisma, or schema changes. The existing `GET /recipes` and
  `GET /ingredients` responses already carry every field needed (`storageUnit`, `status`,
  `shelfLifePlace`, derived `costPerStorageUnit`). All aggregation stays client-side.
- **Single feature module touched:** the dashboard page component, plus the two locale resource files
  and the shadcn setup artefacts (see below).
- **shadcn adoption is dashboard-scoped.** Initialise shadcn/ui in the frontend and pull only the
  primitives the dashboard needs (card, select, badge, chart, separator). Other pages are not
  migrated in this PRD. Note: initialisation writes `components.json`, a `src/components/ui/`
  directory, and edits the global stylesheet's theme variables — so although the *usage* is
  dashboard-only, the *setup* touches global CSS. This is accepted.
- **Palette preserved.** Map the existing orange accent and stone neutrals into shadcn's CSS
  variables rather than adopting shadcn's default neutral theme, keeping brand consistency.
- **Hero metric — priciest recipe per unit.** From CLOSED recipes, scope to the selected
  `storageUnit`, rank descending by `costPerStorageUnit`, take the top one, and render it large with
  its SAR cost and unit label. A unit selector (options = distinct `storageUnit` values across CLOSED
  recipes, sorted) defaults to the first available unit. This deliberately mirrors the existing
  charts' `costPerStorageUnit` basis; total-cost / spend metrics were considered and not chosen.
- **Count cards unchanged in data.** Same three permission-gated counts; only re-rendered as compact
  shadcn cards.
- **Both cost charts retained, compacted.** Top-10 recipe-cost and top-10 ingredient-cost charts keep
  their existing scoping, filtering, sorting, cap-at-10, and empty-state behaviour. Only presentation
  changes: shadcn chart wrapper, height reduced to roughly 220px. Each chart keeps its **own**
  independent storage-unit filter — no shared/global filter.
- **Shelf-life card retained, restyled.** Same all-recipes grouping across the three fixed
  shelf-life-place buckets; re-rendered in shadcn style.
- **Layout target.** Reduce inter-section spacing so hero + cards + both compacted charts +
  shelf-life card read as approximately one screen on a typical desktop viewport.
- **Permission gating preserved.** The analytics gate hides the hero cost widget and both charts
  together, exactly as the current section is gated.
- **Localization.** New keys in the dashboard namespace (EN + AR) for the hero label and its unit
  selector; existing right-to-left tick/margin handling reused for the charts.
- **Currency.** SAR, hardcoded, consistent with the current dashboard.

## Testing Decisions

- **What makes a good test here:** assert observable dashboard behaviour — that the hero shows the
  correct top recipe for the selected unit, that switching the hero unit re-selects the correct
  recipe, that changing the hero unit never mixes recipes of other units, that each chart's filter
  narrows only its own chart, that permission-gated widgets appear/disappear with permissions, and
  that empty states render when a unit has no closed recipes — rather than internal derivation
  helpers or component internals.
- **Primary seam (single):** the dashboard page component driven through its two data sources. The
  highest seam is the rendered dashboard with `/recipes` and `/ingredients` responses stubbed; tests
  feed representative fixtures (mixed statuses, mixed storage units, varying costs, all three
  shelf-life places) and assert the rendered hero value/unit, hero unit-switch behaviour, per-chart
  filter independence, permission gating, and empty states. This is the same single seam used by the
  cost-charts work and is preferred over testing aggregation helpers in isolation.
- **Prior art:** the project has no automated test runner (no backend test script; frontend runs
  ESLint only). A component test harness (e.g. Vitest + Testing Library + jsdom) is a prerequisite
  for automated coverage; absent that, verification is manual (see Further Notes). Confirm the harness
  decision with the developer before writing tests.
- **Modules under test:** the dashboard page component only.

## Out of Scope

- Any backend, Prisma, or schema change; no new API or aggregation endpoints.
- Migrating other pages/components to shadcn — this PRD is dashboard-scoped.
- Adopting shadcn's default neutral theme — the brand orange/stone palette is retained.
- Changing the cost metric away from `costPerStorageUnit` (total-cost / spend / margin hero
  variants were considered and dropped).
- A shared/global storage-unit filter across the two charts — each keeps its own.
- Removing either cost chart or the shelf-life card — all are retained.
- Chart-type changes (bar charts retained), currency selection / per-organization currency.
- Introducing an automated test framework, unless separately agreed.

## Further Notes

- The hero deliberately inherits the same per-unit `costPerStorageUnit` basis as the existing charts;
  this was chosen by the developer with the mixed-unit limitation understood — a single hero number
  makes the unit basis explicit via its label and selector rather than hiding it.
- Users lacking cost-view permission receive null costs; those rows are excluded so the hero and
  charts still render.
- Manual verification: run the frontend dev server, log in with analytics-view and cost-view
  permissions, open the dashboard, and confirm the hero shows the priciest recipe for the default
  unit; switch the hero unit and confirm the selected recipe changes and never shows another unit's
  recipe; confirm both cost charts render compacted with their independent filters still re-ranking;
  confirm the count cards and shelf-life card render in the new style; confirm the whole page reads on
  roughly one screen; switch to Arabic and confirm translated labels and right-to-left layout; run the
  linter clean.
