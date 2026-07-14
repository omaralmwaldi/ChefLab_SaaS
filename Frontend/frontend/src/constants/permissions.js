// Mirrors Backend/src/constants/permissions.js — the single source of truth for
// permission keys. Keep in sync with the backend catalog. Use these constants in
// `can()` checks and <Can>/<ProtectedRoute permission=...> props instead of raw
// strings so a renamed key breaks loudly at the import site.
export const PERMISSIONS = {
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_EDIT: "users.edit",
  USERS_DELETE: "users.delete",

  ROLES_VIEW: "roles.view",
  ROLES_CREATE: "roles.create",
  ROLES_EDIT: "roles.edit",
  ROLES_DELETE: "roles.delete",

  RECIPES_VIEW: "recipes.view",
  RECIPES_CREATE: "recipes.create",
  RECIPES_EDIT: "recipes.edit",
  RECIPES_DELETE: "recipes.delete",

  INGREDIENTS_VIEW: "ingredients.view",
  INGREDIENTS_CREATE: "ingredients.create",
  INGREDIENTS_EDIT: "ingredients.edit",
  INGREDIENTS_DELETE: "ingredients.delete",

  CATEGORIES_VIEW: "categories.view",
  CATEGORIES_CREATE: "categories.create",
  CATEGORIES_EDIT: "categories.edit",
  CATEGORIES_DELETE: "categories.delete",

  COSTS_VIEW: "costs.view",

  DASHBOARD_ACCESS: "dashboard.access",
  DASHBOARD_ANALYTICS_VIEW: "dashboard.analytics.view",
};

export const PERMISSION_KEYS = Object.values(PERMISSIONS);
