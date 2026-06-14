# CLAUDE.md

## Project: ChefLab

Multi-tenant recipe management SaaS for restaurants/cafés. Organizations manage users, roles, ingredients, recipe categories, and recipes (ingredients + role-assigned steps). Recipe cost derived from `RecipeIngredient.usageUnitCost × quantity`. Arabic/English localization on every entity (`nameAr`/`nameEn`, `titleAr`/`titleEn`).

## Repo layout

- `Backend/` — Node.js + Express 5 + Prisma API (CommonJS, port 3000)
- `Frontend/frontend/` — React 19 + Vite SPA (ESM). Run npm commands from the **inner** folder.
- `AI.md` — full product spec (source of truth for requirements)
- `AGENTS.md` — identical copy of CLAUDE.md (keep in sync)

## Commands

### Backend (`Backend/`)

```
npm run dev              # nodemon src/server.js (auto-reload)
npm start                # node src/server.js (production)
npm run prisma:generate  # after schema edits
npm run prisma:migrate   # create/apply dev migration
npm run prisma:studio    # visual DB browser
```

No test script. Prisma seed: `prisma/seed.js`.

### Frontend (`Frontend/frontend/`)

```
npm run dev      # Vite dev server
npm run build    # dist/
npm run lint     # ESLint (js/jsx, react-hooks + react-refresh)
npm run preview  # serve production build
```

## Architecture

**Pattern: Controller → Service → Prisma.** Routes wire HTTP to controllers; controllers call services; only services import `src/config/prisma.js`. Recipe helpers also import Prisma directly for cross-FK tenant ownership checks.

**Module file naming:** Directories are plural (`categories/`, `ingredients/`, `users/`, `roles/`); files inside use **singular** (`category.controller.js`, `ingredient.service.js`, `user.validation.js`).

**Mount points** (from `src/app.js`): `/auth`, `/users`, `/roles`, `/ingredients`, `/categories`, `/recipes`.

### Key conventions (enforced in code)

- **Multi-tenancy:** Every query scoped by `organizationId` decoded from JWT (`req.user.organizationId`).
- **Zod validation:** Create/update endpoints validate with `schema.parse(req.body)` / `schema.partial().parse(req.body)`. Return `{ errors: error.errors }` + 400 on `ZodError`. **Zod ^4.4.3** — API differs from v3.
- **Prisma P2025** → catch → throw `new Error("X not found or access denied")` → controller maps to 404. Recipe `create` throws plain errors for bad FKs or duplicate steps → controller maps to 400.
- **Recipe cost derived, not stored.** `formatRecipe` returns `{ ...recipe, totalCost: Number(totalCost.toFixed(4)) }` where `totalCost = Σ(quantity × usageUnitCost)`. Never re-derives from `Ingredient.costPerStorageUnit`.
- **Recipe partial updates** replace `ingredients`/`steps` wholesale (`deleteMany: {}` + `create`) when array present; untouched when omitted.
- **Unique constraints:** Tenant models have `@@unique([organizationId, email/sku/nameEn])` and `@@unique([id, organizationId])`. `RecipeIngredient`: `@@unique([recipeId, ingredientId])`. `RecipeStep`: `@@unique([recipeId, stepOrder])`.
- **JWT payload:** `{ userId, organizationId, roleId }`. POST `/auth/login` returns `{ token, user }`.
- **Express 5** (`^5.2.1`). Notable differences from Express 4: `req.query` is a read-only getter; `res.json(null)` throws; route param regex changed.
- **Passwords:** bcrypt cost 10, stored as `passwordHash`. User service strips `password` from request body.

### Known gaps / active dev areas

1. **Permission middleware** — `middlewares/permission.middleware.js` is empty (no RBAC enforcement beyond JWT auth).
2. **Auth validation** — `auth.validation.js` is empty (login payload not validated).
3. **Roles validation** — `roles/` has no `role.validation.js` (create/update accept raw body).
4. **Organization signup** — no `/auth/signup` endpoint; tenants inserted directly.
5. **Frontend** — bare Vite scaffold (`App.jsx` still default counter). Only `react-router-dom` and `axios` installed. No i18n, TanStack Query, React Hook Form, or feature folders built yet.
