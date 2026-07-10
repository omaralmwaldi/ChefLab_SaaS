# PRD: Auto SKU Generator

## Overview

Add an auto-generate option to the SKU field on all create forms (Ingredients, Categories, Recipes). Users can choose between auto-generated or manually typed SKUs. Edit forms are unchanged.

---

## Problem

Every new ingredient, category, and recipe requires a manually typed SKU. This is repetitive, error-prone, and slows down data entry. Users frequently hit duplicate-SKU errors because they have to track numbering themselves.

---

## Goals

- Reduce friction on create forms by offering a one-click auto-generated SKU.
- Keep manual entry available for users who want control.
- Zero risk to existing records — edit forms are untouched.

---

## Non-Goals

- Auto-generation on edit forms.
- Bulk SKU regeneration for existing records.
- Global (cross-entity) SKU counter.

---

## Requirements

### Functional

| # | Requirement |
|---|-------------|
| F1 | Create forms for Ingredients, Categories, and Recipes show an **Auto / Manual** toggle next to the SKU label. |
| F2 | Default mode is **Auto**. The SKU field is pre-filled with the next available SKU on modal open. |
| F3 | Auto-generated format: `SK-0001`, `SK-0002`, … (prefix `SK-` + 4-digit zero-padded integer). |
| F4 | Counter is **independent per entity per organization** (ingredients, categories, and recipes each count from `SK-0001`). |
| F5 | The pre-filled SKU field is **editable** — user can override it before submitting. |
| F6 | Switching to **Manual** clears the field. Switching back to **Auto** re-fetches the next SKU. |
| F7 | If the next-SKU fetch fails, silently fall back to Manual mode (empty editable field). |
| F8 | SKU uniqueness is enforced server-side as before (409 Conflict if duplicate). |

### Non-Functional

| # | Requirement |
|---|-------------|
| N1 | Next-SKU generation adds one lightweight `findMany` query per fetch — no migrations, no new tables. |
| N2 | Race condition (two users get same next SKU) is handled by the existing P2002 → 409 path. |
| N3 | No new npm packages required. |

---

## UX Flow

```
User opens Create modal
        │
        ▼
[Auto] [Manual]  ← toggle, Auto selected by default
SKU: [SK-0003]   ← pre-filled, editable
        │
   ┌────┴────┐
   │         │
User keeps  User edits
auto value   value
   │         │
   └────┬────┘
        ▼
     Submit → server validates uniqueness → success / 409
```

---

## API

### `GET /<entity>/next-sku`

Returns the next available SKU for the authenticated user's organization.

- **Auth:** JWT required (same as all other endpoints)
- **Permission:** `<entity>.view`
- **Entities:** `/ingredients/next-sku`, `/categories/next-sku`, `/recipes/next-sku`

**Response 200:**
```json
{ "sku": "SK-0004" }
```

**Response 422** (when `SK-9999` is already taken):
```json
{ "message": "SKU namespace full" }
```

---

## Affected Files

### Backend (× 3 entities)
- `ingredient.service.js` / `category.service.js` / `recipe.service.js` — add `getNextSku(organizationId)`
- `ingredient.controller.js` / `category.controller.js` / `recipe.controller.js` — add `getNextSku` handler
- `ingredient.routes.js` / `category.routes.js` / `recipe.routes.js` — register `GET /next-sku` before `GET /:id`

### Frontend (create modals only)
- `IngredientModal.jsx` — add toggle + fetch (guarded to create mode)
- `CategoryModal.jsx` — same
- `RecipeModal.jsx` — same (no guard needed, create-only component)

---

## Out of Scope

- `RecipeEditor.jsx` (edit form) — no changes.
- Excel import — continues to require explicit SKU column.
- SKU format customization per organization.
