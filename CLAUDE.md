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
    auth/                 # login, /me. Has controller, service, routes, mapper. (No validation yet.)
    roles/                # CRUD + JSONB permissions
    users/                # CRUD; hashes passwords with bcrypt (cost 10). Service has no controller/routes wired yet.
    categories/           # Full CRUD reference implementation (controller/service/routes/validation)
    ingredients/          # Full CRUD with Zod validation
    recipes/              # Directory exists but is empty — this is the next big module to build
```

**Each module folder conventionally contains** `*.controller.js`, `*.service.js`, `*.routes.js`, and (for write endpoints) `*.validation.js` with a Zod schema. Follow the `categories/` or `ingredients/` module as the reference template.

### Conventions (from AI.md, enforced in code)

- **Multi-tenancy:** every query must scope by `organizationId`. The `auth` middleware decodes `organizationId` from the JWT and exposes it as `req.user.organizationId`. Services receive it as an argument; controllers pass it from `req.user`.
- **No Prisma in controllers** — only services import `config/prisma.js`.
- **Validate with Zod** in the controller, then call `schema.partial().parse(req.body)` for `PUT` endpoints so partial updates work. Return `{ errors: error.errors }` with status 400 on `ZodError`.
- **Prisma error code `P2025`** means "record not found"; the standard pattern is to catch it and throw `new Error("X not found or access denied")`, which the controller maps to 404.
- **Common unique constraints** worth knowing: every tenant-scoped model has `@@unique([organizationId, email/sku/nameEn])` and a composite `@@unique([id, organizationId])` to make `where: { id, organizationId }` upserts safe.
- **Authentication:** `POST /auth/login` returns `{ token, user }`. Subsequent requests send `Authorization: Bearer <token>`. The token payload is `{ userId, organizationId, roleId }`. Most module routers apply `authMiddleware` globally (see `category.routes.js`); `auth.routes.js` is the exception and only protects `GET /me`.
- **Passwords** are stored as `passwordHash` (bcrypt, cost 10). The user service strips `password` from the request body before persisting.
- **Arabic/English fields** are required on every translatable entity. Validation schemas require both `_ar` and `_en` (e.g. `categorySchema` needs `nameAr` + `nameEn` + `sku`).
- **Permissions** are stored as JSONB on `Role.permissions` keyed by strings from `constants/permissions.js` (e.g. `{ "recipes.create": true }`). The `permission.middleware.js` is currently an empty file — the RBAC enforcement layer is **not yet implemented**; do not assume endpoints are guarded beyond JWT auth.

### Environment

`Backend/.env` holds `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and Cloudinary credentials. `DATABASE_URL` is PostgreSQL. The repo's `.env` is checked in (it contains a local Postgres URL and a JWT secret — be cautious about committing in other contexts).

## Database (Prisma)

`Backend/prisma/schema.prisma` — PostgreSQL, UUIDs everywhere, snake_case table names via `@@map`, camelCase field names mapped with `@map("snake_case")`.

Models: `Organization` → has many `User`, `Role`, `Ingredient`, `RecipeCategory`, `Recipe`. `Recipe` joins `RecipeCategory`, contains `RecipeIngredient` (snapshots `usageUnit` + `usageUnitCost` at recipe time) and `RecipeStep` (each step assigned to a `Role`). `User` is optionally linked to a `Role`. `Recipe.status` is an enum (`DRAFT` | `CLOSED`).

Note: there is **no model for an Organization creation/signup endpoint** yet, and the `Recipe` CRUD (`/recipes`) is the main missing piece — `app.js` currently mounts only `/auth`, `/roles`, `/ingredients`, `/categories`.

## Frontend Architecture

Currently a fresh Vite + React 19 scaffold (`App.jsx` is still the default Vite starter with a counter). Intended stack per `AI.md` and `package.json`: React Router, TanStack Query (server state), React Hook Form (forms), Zod (validation), i18next (Arabic/English), Axios (HTTP). Only `react-router-dom` and `axios` are installed so far — the others are not yet in `package.json`.

`src/api/` and `src/components/` directories exist but are empty — they are the planned homes for the Axios client and shared components.

## Active Development Areas (where to focus)

1. **`/recipes` module** — empty directory; the largest remaining CRUD (create/list/get/update/delete with `RecipeIngredient` lines and `RecipeStep` lines, cost calculation).
2. **`/users` module** — has `user.service.js` and `user.validation.js` but no `user.controller.js` / `user.routes.js` and is not mounted in `app.js`.
3. **Permission middleware** — `permission.middleware.js` is empty; need to read `req.user.roleId` → role → `permissions` JSONB → enforce.
4. **Frontend features** — replace the Vite starter `App.jsx` and build out feature folders (auth, recipes, ingredients, roles, users, categories), API client, and i18n setup.
5. **Auth `validation.js`** is empty — login payload (`email`, `password`) should be Zod-validated like other modules.
