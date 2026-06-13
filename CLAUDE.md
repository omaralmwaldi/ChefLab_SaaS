# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: ChefLab

Multi-tenant recipe management SaaS for restaurants and cafés. Organizations manage users, roles, ingredients, recipe categories, and recipes (with ingredients + role-assigned preparation steps). Recipe cost is derived from `RecipeIngredient.usageUnitCost × quantity`. Supports Arabic/English localization on every entity (`nameAr`/`nameEn`, `titleAr`/`titleEn`, etc.).

Repo layout:
- `Backend/` — Node.js + Express + Prisma API (CommonJS, port 3000)
- `Frontend/frontend/` — React 19 + Vite SPA (ESM). Note the nested `frontend/frontend/` path — run npm commands from inside the inner folder.
- `AI.md` — full product spec, architecture, and conventions (the source of truth for "what we're building")

## Common Commands

### Backend (`/Backend`)

```bash
npm run dev              # nodemon src/server.js (auto-reload on changes)
npm start                # node src/server.js (production)
npm run prisma:generate  # regenerate Prisma client after schema edits
npm run prisma:migrate   # create/apply dev migration
npm run prisma:studio    # visual DB browser
```

There is no test script configured (`npm test` exits with an error). The `prisma/` folder also contains `seed.js` for seeding the database.

### Frontend (`/Frontend/frontend`)

```bash
npm run dev      # Vite dev server
npm run build    # production build to dist/
npm run lint     # ESLint (js, jsx; uses react-hooks + react-refresh)
npm run preview  # serve the production build
```

## Backend Architecture

**Pattern: Controller → Service → Prisma.** Routes wire HTTP to controllers; controllers call services; services are the only layer that touches Prisma (`src/config/prisma.js`).

```
src/
  app.js                  # Express app; mounts module routers under /<module>
  server.js               # Loads .env, starts listener on PORT
  config/prisma.js        # PrismaClient singleton
  constants/permissions.js # Permission string constants (e.g. "recipes.create")
  middlewares/
    auth.middleware.js    # JWT bearer auth → attaches req.user = { userId, organizationId, roleId }
    permission.middleware.js # placeholder, not yet implemented
  utils/jwt.js            # generateToken (HS256, uses JWT_SECRET + JWT_EXPIRES_IN)
  modules/
    auth/                 # login, /me. controller, service, routes, mapper, validation (empty)
    roles/                # CRUD + JSONB permissions (no validation file yet)
    users/                # Full CRUD: controller, service, routes, validation. Mounted at /users.
    categories/           # Full CRUD reference implementation (controller/service/routes/validation)
    ingredients/          # Full CRUD with Zod validation
    recipes/              # Full CRUD: controller, service, routes, validation, helpers, constants
```

**Each module folder conventionally contains** `*.controller.js`, `*.service.js`, `*.routes.js`, and (for write endpoints) `*.validation.js` with a Zod schema. Follow the `categories/`, `ingredients/`, or `users/` module as the reference template.

The `/recipes` module has extra non-standard files worth knowing about:
- `recipe.constants.js` — exports `RECIPE_INCLUDE` (the eager-load shape: `category`, `ingredients.ingredient`, `steps.role` ordered by `stepOrder`). Used by every service call so the API response stays consistent.
- `recipe.helpers.js` — `toNumber` (Decimal-safe), `computeTotalCost`, `formatRecipe` (adds derived `totalCost`), `assertTenantOwnership` (validates category/ingredient/role FKs all belong to the org), `buildIngredientLines` / `buildStepLines` (nested-write payload builders; the steps builder rejects duplicate `stepOrder` values with a clear error).

### Conventions (from AI.md, enforced in code)

- **Multi-tenancy:** every query must scope by `organizationId`. The `auth` middleware decodes `organizationId` from the JWT and exposes it as `req.user.organizationId`. Services receive it as an argument; controllers pass it from `req.user`.
- **No Prisma in controllers** — only services import `config/prisma.js`. Recipe module's helpers also import Prisma directly for the cross-FK ownership check.
- **Validate with Zod** in the controller, then call `schema.partial().parse(req.body)` for `PUT` endpoints so partial updates work. Return `{ errors: error.errors }` with status 400 on `ZodError`. Note: the `roles/` module currently skips Zod validation (no `role.validation.js`).
- **Prisma error code `P2025`** means "record not found"; the standard pattern is to catch it and throw `new Error("X not found or access denied")`, which the controller maps to 404. The recipe service uses this on update/delete; create throws plain `Error("Category not found or access denied")` / `("...ingredients...")` / `("...roles...")` / `("Duplicate stepOrder values are not allowed")` which the controller maps to 400 (client supplied bad data, not a missing record).
- **Recipe cost** is derived, not stored: `formatRecipe` returns `{ ...recipe, totalCost: Number(totalCost.toFixed(4)) }` where `totalCost = Σ(quantity × usageUnitCost)`. The service never re-derives cost from `Ingredient.costPerStorageUnit` — historical accuracy is the caller's responsibility when supplying the `usageUnitCost` snapshot.
- **Recipe partial updates** replace `ingredients` and `steps` wholesale (`deleteMany: {}` + `create`) when the array is present, and leave them untouched when omitted. This matches the partial-update convention used by other modules rather than diff-merge.
- **Common unique constraints** worth knowing: every tenant-scoped model has `@@unique([organizationId, email/sku/nameEn])` and a composite `@@unique([id, organizationId])` to make `where: { id, organizationId }` upserts safe. `RecipeIngredient` additionally has `@@unique([recipeId, ingredientId])` and `RecipeStep` has `@@unique([recipeId, stepOrder])`.
- **Authentication:** `POST /auth/login` returns `{ token, user }`. Subsequent requests send `Authorization: Bearer <token>`. The token payload is `{ userId, organizationId, roleId }`. All six module routers apply `authMiddleware` globally; `auth.routes.js` is the exception and only protects `GET /me`.
- **Passwords** are stored as `passwordHash` (bcrypt, cost 10). The user service strips `password` from the request body before persisting.
- **Arabic/English fields** are required on every translatable entity. Validation schemas require both `_ar` and `_en` (e.g. `categorySchema` needs `nameAr` + `nameEn` + `sku`; `recipeSchema` needs `nameAr` + `nameEn` + `sku` + `yieldQuantity` + `yieldUnit` + `categoryId` + `ingredients[]` + `steps[]`).
- **Permissions** are stored as JSONB on `Role.permissions` keyed by strings from `constants/permissions.js` (e.g. `{ "recipes.create": true }`). The current constants cover `.view` / `.create` / `.edit` / `.delete` for users, roles, recipes, ingredients, and categories. The `permission.middleware.js` is an empty file — the RBAC enforcement layer is **not yet implemented**; do not assume endpoints are guarded beyond JWT auth.

### Environment

`Backend/.env` holds `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and Cloudinary credentials. `DATABASE_URL` is PostgreSQL. The repo's `.env` is checked in (it contains a local Postgres URL and a JWT secret — be cautious about committing in other contexts).

## Database (Prisma)

`Backend/prisma/schema.prisma` — PostgreSQL, UUIDs everywhere, snake_case table names via `@@map`, camelCase field names mapped with `@map("snake_case")`.

Models: `Organization` → has many `User`, `Role`, `Ingredient`, `RecipeCategory`, `Recipe`. `Recipe` joins `RecipeCategory`, contains `RecipeIngredient` (snapshots `usageUnit` + `usageUnitCost` at recipe time) and `RecipeStep` (each step assigned to a `Role`, with bilingual `title*`/`description*` and optional `imageUrl`/`videoUrl`). `User` is optionally linked to a `Role`. `Recipe.status` is an enum (`DRAFT` | `CLOSED`) and `Recipe.createdBy` is a `User.id` (no FK relation in the schema — denormalized).

The `src/services/` directory exists at `Backend/src/services/` but is currently empty — it is **not** the convention used by any module (all services live next to their controller in `modules/<name>/`).

Note: there is **no model for an Organization creation/signup endpoint** yet.

## Frontend Architecture

Currently a fresh Vite + React 19 scaffold (`App.jsx` is still the default Vite starter with a counter). Intended stack per `AI.md` and `package.json`: React Router, TanStack Query (server state), React Hook Form (forms), Zod (validation), i18next (Arabic/English), Axios (HTTP). Only `react-router-dom` and `axios` are installed so far — the others are not yet in `package.json`.

`src/api/` and `src/components/` directories exist but are empty — they are the planned homes for the Axios client and shared components.

## Active Development Areas (where to focus)

1. **Permission middleware** — `permission.middleware.js` is empty; need to read `req.user.roleId` → role → `permissions` JSONB → enforce.
2. **Auth `validation.js`** is empty — login payload (`email`, `password`) should be Zod-validated like other modules.
3. **Roles validation** — `modules/roles/` has no `role.validation.js`; create/update accept raw `req.body`.
4. **Frontend features** — replace the Vite starter `App.jsx` and build out feature folders (auth, recipes, ingredients, roles, users, categories), API client, and i18n setup.
5. **Organization signup endpoint** — no `Organization` creation/signup route exists; tenants currently have to be inserted directly.
