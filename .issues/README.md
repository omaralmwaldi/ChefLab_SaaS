# Sub-recipe as Ingredient — Issue Index

PRD: see `/Users/omaralmwaldi/Desktop/ChefLab_SaaS/sub-recipe-as-ingredient.md`

## Slices

| # | Issue | Blocked by | Primary concern |
|---|-------|-----------|-----------------|
| 1 | [Schema migration](./01-schema-migration.md) | — | `subRecipeId` FK, CHECK constraint, back-relation, uniqueness |
| 2 | [Sub-recipe line creation + strict validation](./02-sub-recipe-creation-and-validation.md) | 1 | Zod union, server-derived `usageUnit`/`usageUnitCost`, response shape |
| 3 | [Cycle prevention](./03-cycle-prevention.md) | 2 | Duplicate-on-create, BFS-on-update, self-link reject |
| 4 | [`yieldUnit` lock](./04-yieldunit-lock.md) | 2 | Reject `yieldUnit` edit when recipe is referenced |
| 5 | [Cost snapshot](./05-cost-snapshot.md) | 2 | Parent cost unchanged after sub-recipe edits |
| 6 | [Tenant isolation](./06-tenant-isolation.md) | 2 | Cross-org `subRecipeId` rejected on read and write |
| 7 | [Delete protection](./07-delete-protection.md) | 2 | `DELETE /recipes/:id` blocked when recipe is a sub-recipe of others |
| 8 | [Frontend: Recipe Editor sub-recipe support](./08-frontend-recipe-editor.md) | 2, 3, 4, 5, 6, 7 | Unified picker, payload shape, sub-recipe line rendering, `yieldUnit` disable banner |

## Dependency graph

```
1 → 2 → 3
   ↘ 4
   ↘ 5
   ↘ 6
   ↘ 7
        ↘ 8
```

Slices 3, 4, 5, 6, 7 are independent of each other and can be worked in parallel once 2 lands. Slice 8 consumes all of them and is the integration surface.
