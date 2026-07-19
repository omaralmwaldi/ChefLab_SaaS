# 04 — shadcn setup + brand palette

**Triage label:** ready-for-agent

## Parent

`docs/prd-dashboard-single-look-redesign.md`

## What to build

Introduce shadcn/ui into the frontend as a prefactor for the dashboard redesign, scoped so only the
dashboard will consume it. Initialise shadcn, wire its theme to the existing brand palette (orange
accent, stone neutrals) via CSS variables rather than adopting shadcn's default neutral theme, and
add the primitives the redesign needs: card, select, badge, chart, separator. No dashboard behaviour
changes yet — this slice lands the design-system foundation and proves a shadcn component renders in
brand colours.

## Acceptance criteria

- [ ] shadcn is initialised in the frontend (`components.json` present, `src/components/ui/` created)
- [ ] Theme CSS variables map to the existing orange accent + stone neutrals (not shadcn default zinc)
- [ ] card, select, badge, chart, and separator primitives are installed
- [ ] A sample shadcn card renders with the brand colours (verified on the dashboard or a scratch view)
- [ ] Build and lint pass clean; no other page's appearance regresses
- [ ] Existing dashboard still renders (no functional changes in this slice)

## Blocked by

None - can start immediately
