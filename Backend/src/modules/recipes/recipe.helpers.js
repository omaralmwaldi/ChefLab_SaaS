const prisma = require("../../config/prisma");

// ---------- Decimal-safe arithmetic ----------

// Decimal math: Prisma returns Decimal instances for @db.Decimal columns.
// We use .toNumber() to avoid floating-point drift when summing costs.
function toNumber(value) {
  if (value === null || value === undefined) return 0;
  return typeof value.toNumber === "function" ? value.toNumber() : Number(value);
}

// ---------- Cost derivation ----------

// Compute the total recipe cost from its ingredient lines.
// Each RecipeIngredient row snapshots usageUnitCost at recipe creation time,
// so the cost is derived purely from the recipe's own data (not the live
// Ingredient.costPerStorageUnit) — this preserves historical accuracy when
// ingredient prices change later.
function computeTotalCost(ingredients) {
  return ingredients.reduce((sum, line) => {
    const qty = toNumber(line.quantity);
    const unitCost = toNumber(line.usageUnitCost);
    return sum + qty * unitCost;
  }, 0);
}

// Shape returned to callers: the recipe row, its nested lines, and a derived
// total cost. We project cost client-side rather than storing it because it
// is fully derivable from the lines and can drift if persisted.
function formatRecipe(recipe) {
  if (!recipe) return recipe;
  const totalCost = computeTotalCost(recipe.ingredients || []);
  return {
    ...recipe,
    totalCost: Number(totalCost.toFixed(4)),
  };
}

// ---------- Tenant ownership ----------

// Verify that every referenced FK (category, each ingredient, each step's
// role) belongs to the same organization. Throws on the first violation so
// the controller can return 400 — without this, Prisma would happily
// persist cross-tenant links via raw IDs in req.body.
async function assertTenantOwnership(organizationId, { categoryId, ingredientIds, roleIds }) {
  if (categoryId) {
    const found = await prisma.recipeCategory.findFirst({
      where: { id: categoryId, organizationId },
      select: { id: true },
    });
    if (!found) throw new Error("Category not found or access denied");
  }

  if (ingredientIds && ingredientIds.length > 0) {
    const found = await prisma.ingredient.findMany({
      where: { id: { in: ingredientIds }, organizationId },
      select: { id: true },
    });
    if (found.length !== new Set(ingredientIds).size) {
      throw new Error("One or more ingredients not found or access denied");
    }
  }

  if (roleIds && roleIds.length > 0) {
    const found = await prisma.role.findMany({
      where: { id: { in: roleIds }, organizationId },
      select: { id: true },
    });
    if (found.length !== new Set(roleIds).size) {
      throw new Error("One or more roles not found or access denied");
    }
  }
}

// ---------- Nested-write payload builders ----------

// Build the nested-write payload for RecipeIngredient lines. Per the
// validation contract, the caller must provide quantity, usageUnit, and
// usageUnitCost for every line — we pass them straight through. Duplicate
// (recipeId, ingredientId) pairs are blocked by the @@unique in the
// schema and will surface as a P2002 — callers should de-dupe upstream.
function buildIngredientLines(lines) {
  if (!lines || lines.length === 0) return [];
  return lines.map((line) => ({
    ingredientId: line.ingredientId,
    quantity: line.quantity,
    usageUnit: line.usageUnit,
    usageUnitCost: line.usageUnitCost,
  }));
}

function buildStepLines(steps) {
  if (!steps || steps.length === 0) return [];
  // Defend against duplicate stepOrder values — the DB has a unique
  // constraint on (recipeId, stepOrder) and the error from that is opaque.
  const orders = steps.map((s) => s.stepOrder);
  if (new Set(orders).size !== orders.length) {
    throw new Error("Duplicate stepOrder values are not allowed");
  }
  return steps.map((step) => ({
    stepOrder: step.stepOrder,
    titleAr: step.titleAr,
    titleEn: step.titleEn,
    descriptionAr: step.descriptionAr,
    descriptionEn: step.descriptionEn,
    imageUrl: step.imageUrl,
    videoUrl: step.videoUrl,
    roles: {
      create: step.roleIds.map((roleId) => ({ roleId })),
    },
  }));
}

module.exports = {
  toNumber,
  computeTotalCost,
  formatRecipe,
  assertTenantOwnership,
  buildIngredientLines,
  buildStepLines,
};
