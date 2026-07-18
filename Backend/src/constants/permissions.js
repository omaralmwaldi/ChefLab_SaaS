// Single source of truth for every permission key in the system.
// Keys are two-part `module.action` (e.g. "recipes.view"); a few extend to
// three parts (e.g. "dashboard.analytics.view"). The module is the segment
// before the first dot.
const PERMISSIONS = {
  USERS_VIEW: "users.view",
  USERS_MANAGE: "users.manage",

  ROLES_VIEW: "roles.view",
  ROLES_MANAGE: "roles.manage",

  RECIPES_VIEW: "recipes.view",
  RECIPES_CREATE: "recipes.create",
  RECIPES_EDIT: "recipes.edit",
  RECIPES_DELETE: "recipes.delete",

  INGREDIENTS_VIEW: "ingredients.view",
  INGREDIENTS_MANAGE: "ingredients.manage",

  CATEGORIES_VIEW: "categories.view",
  CATEGORIES_MANAGE: "categories.manage",

  COSTS_VIEW: "costs.view",

  DASHBOARD_ACCESS: "dashboard.access",
  DASHBOARD_ANALYTICS_VIEW: "dashboard.analytics.view",
};

// Every valid permission key, derived from the map above.
const PERMISSION_KEYS = Object.values(PERMISSIONS);

// Catalog grouped by module (the segment before the first dot). Derived from
// PERMISSION_KEYS so adding a key to PERMISSIONS surfaces here — and in the
// GET /permissions response — with no further wiring.
const PERMISSION_CATALOG = PERMISSION_KEYS.reduce((catalog, key) => {
  const module = key.split(".")[0];
  (catalog[module] ||= []).push(key);
  return catalog;
}, {});

// Default export stays the flat key map for backward compatibility
// (`PERMISSIONS.ROLES_VIEW` across route files). The derived catalog and key
// list attach as non-enumerable props so `Object.values(PERMISSIONS)` stays
// the pure key map.
Object.defineProperties(PERMISSIONS, {
  PERMISSION_KEYS: { value: PERMISSION_KEYS, enumerable: false },
  PERMISSION_CATALOG: { value: PERMISSION_CATALOG, enumerable: false },
});

module.exports = PERMISSIONS;
