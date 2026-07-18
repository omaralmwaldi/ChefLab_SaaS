const { Prisma } = require("@prisma/client");
const prisma = require("../../config/prisma");

// ---------- Decimal-safe arithmetic ----------

// Decimal math: Prisma returns Decimal instances for @db.Decimal columns.
// We use .toNumber() to avoid floating-point drift when summing costs.
function toNumber(value) {
  if (value === null || value === undefined) return 0;
  return typeof value.toNumber === "function"
    ? value.toNumber()
    : Number(value);
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

// exp output: totalCost / yieldQuantity, rounded to 4 decimal places. Returns 0 if
function computeCostPerYieldUnit(totalCost, yieldQuantity) {
  const cost = new Prisma.Decimal(totalCost);
  const yieldQty = new Prisma.Decimal(toNumber(yieldQuantity));

  if (yieldQty.lte(0)) {
    return 0;
  }

  return Number(cost.dividedBy(yieldQty).toFixed(4));
}

function computeCostPerStorageUnit(totalCost, yieldQuantity, conversionFactor) {
  const cf = toNumber(conversionFactor);

  if (!cf || cf <= 0) {
    return 0;
  }

  return Number(
    (computeCostPerYieldUnit(totalCost, yieldQuantity) * cf).toFixed(4),
  );
}

// Shape returned to callers: the recipe row, its nested lines, and a derived
// total cost. We project cost client-side rather than storing it because it
// is fully derivable from the lines and can drift if persisted.
function formatRecipe(recipe) {
  if (!recipe) return recipe;
  const totalCost = computeTotalCost(recipe.ingredients || []);
  const costPerStorageUnit = computeCostPerStorageUnit(
    totalCost,
    recipe.yieldQuantity,
    recipe.conversionFactor,
  );
  return {
    ...recipe,
    totalCost: Number(totalCost.toFixed(4)),
    costPerStorageUnit: Number(costPerStorageUnit.toFixed(4)),
    isUsedAsSubRecipe: (recipe._count?.subRecipeOfLinks ?? 0) > 0,
  };
}

// ---------- Step visibility ----------

// Trim a recipe's steps to those the requester may see. The owner and any
// recipes.edit holder see every step (canViewAllSteps); a role-scoped
// requester sees only steps assigned to their role via RecipeStepRole.
// Other roles' steps are removed from the payload, not merely flagged.
function filterStepsForRequester(recipe, { canViewAllSteps, roleId }) {
  if (!recipe || !recipe.steps || canViewAllSteps) return recipe;
  const steps = recipe.steps.filter((step) =>
    step.roles?.some((sr) => sr.roleId === roleId),
  );
  return { ...recipe, steps };
}

// ---------- Tenant ownership ----------

// Verify that every referenced FK (category, each ingredient, each step's
// role) belongs to the same organization. Throws on the first violation so
// the controller can return 400 — without this, Prisma would happily
// persist cross-tenant links via raw IDs in req.body.
async function assertTenantOwnership(
  organizationId,
  { categoryId, ingredientIds, roleIds, subRecipeIds },
) {
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

  if (subRecipeIds && subRecipeIds.length > 0) {
    const found = await prisma.recipe.findMany({
      where: { id: { in: subRecipeIds }, organizationId },
      select: { id: true },
    });
    if (found.length !== new Set(subRecipeIds).size) {
      throw new Error("One or more sub-recipes not found or access denied");
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
  return lines.map((line) => {
    const base = {
      quantity: line.quantity,
      usageUnit: line.usageUnit,
      usageUnitCost: line.usageUnitCost,
    };
    if (line.subRecipeId) {
      return { ...base, subRecipeId: line.subRecipeId };
    }
    return { ...base, ingredientId: line.ingredientId };
  });
}

// Given sub-recipe lines from the client (only subRecipeId + quantity),
// look up each sub-recipe, compute its totalCost, and derive usageUnit
// (from sub-recipe's yieldUnit) and usageUnitCost (totalCost / yieldQuantity)
// using Decimal arithmetic. Returns lines shaped for buildIngredientLines.
async function buildSubRecipeLines(lines, organizationId) {
  if (!lines || lines.length === 0) return [];

  const subRecipeIds = [...new Set(lines.map((l) => l.subRecipeId))];
  const subRecipes = await prisma.recipe.findMany({
    where: { id: { in: subRecipeIds }, organizationId },
    select: {
      id: true,
      yieldUnit: true,
      yieldQuantity: true,
      ingredients: {
        select: { quantity: true, usageUnitCost: true },
      },
    },
  });

  const subRecipeMap = {};
  for (const sr of subRecipes) {
    subRecipeMap[sr.id] = {
      yieldUnit: sr.yieldUnit,
      yieldQuantity: sr.yieldQuantity,
      totalCost: computeTotalCost(sr.ingredients || []),
    };
  }

  return lines.map((line) => {
    const sr = subRecipeMap[line.subRecipeId];
    if (!sr) throw new Error(`Sub-recipe not found: ${line.subRecipeId}`);

    // usageUnitCost = totalCost / yieldQuantity — Decimal arithmetic
    const usageUnitCost = computeCostPerYieldUnit(
      sr.totalCost,
      sr.yieldQuantity,
    );
    return {
      subRecipeId: line.subRecipeId,
      quantity: line.quantity,
      usageUnit: sr.yieldUnit,
      usageUnitCost,
    };
  });
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

// ---------- Cycle detection ----------

// BFS walk upward from subRecipeIds to detect cycles in the recipe graph.
// Queries recipe_ingredients filtered by sub_recipe_id to find parent recipes
// that reference any frontier sub-recipe. If any parent equals recipeId, a
// cycle would be created. Uses a visited set to avoid re-traversal. Capped at
// depth 50 as a defensive bound.
async function checkForCycles(recipeId, subRecipeIds) {
  if (!subRecipeIds || subRecipeIds.length === 0) return;

  const uniqueSubRecipeIds = [...new Set(subRecipeIds)];// uniqueSubRecipeIds = [Toffe Sauce, Chocolate Sauce, Caramel Sauce]

  // Immediate self-link rejection
  if (uniqueSubRecipeIds.includes(recipeId)) {
    throw new Error(`you cannot add recipe ${recipeId} as a sub-recipe of itself`);
  }

  const MAX_DEPTH = 50;
  let depth = 0;
  const visited = new Set();
  let frontier = uniqueSubRecipeIds;

  while (frontier.length > 0) {
    if (depth >= MAX_DEPTH) {
      throw new Error("Sub-recipe chain exceeds maximum depth");
    }

    for (const id of frontier) {
      visited.add(id);
    }

    // Find all parent recipes that reference any frontier sub-recipe
    const parents = await prisma.recipeIngredient.findMany({
      where: { subRecipeId: { in: frontier } },
      select: { recipeId: true },
    });

    // Deduplicate parent IDs
    const parentIds = [...new Set(parents.map((p) => p.recipeId))];

    // Any parent matching the recipe being updated means a cycle
    for (const parentId of parentIds) {
      if (parentId === recipeId) {
        throw new Error("Sub-recipe link would create a cycle");
      }
    }

    // Next frontier: parent IDs not yet visited
    frontier = parentIds.filter((id) => !visited.has(id));
    depth++;
  }
}

module.exports = {
  toNumber,
  computeTotalCost,
  computeCostPerStorageUnit,
  formatRecipe,
  filterStepsForRequester,
  assertTenantOwnership,
  buildIngredientLines,
  buildSubRecipeLines,
  buildStepLines,
  checkForCycles,
};
