// Eagerly load a recipe with everything the API needs to return:
// category, ingredient lines (with the ingredient snapshot), and steps
// (with the assigned role). Tenant-scoped by organizationId.
const RECIPE_INCLUDE = {
  category: true,
  ingredients: {
    include: {
      ingredient: {
        select: { id: true, sku: true, nameAr: true, nameEn: true, usageUnit: true },
      },
    },
  },
  steps: {
    include: {
      role: { select: { id: true, nameAr: true, nameEn: true } },
    },
    orderBy: { stepOrder: "asc" },
  },
};

module.exports = {
  RECIPE_INCLUDE,
};
