const prisma = require("../../config/prisma");

// Defensive helper to convert Prisma Decimal or any other numeric input to a plain
function toNumber(value) {
  if (value === null || value === undefined) return 0;
  return typeof value.toNumber === "function" ? value.toNumber() : Number(value);
}

// Compute the total cost of a recipe by summing the cost of each ingredient line:
// quantity * usageUnitCost. We use toNumber to handle Prisma Decimal values
function computeTotalCost(ingredientObject) {
  return ingredientObject.reduce((sum, ingredient) => {
    const qty = toNumber(ingredient.quantity);
    const usageUnitCost = toNumber(ingredient.usageUnitCost);
    return sum + qty * usageUnitCost;
  }, 0);
}

// Format a recipe for API response by adding a computed totalCost field.
function formatRecipe(recipe) {
  if (!recipe) return recipe;
  const totalCost = computeTotalCost(recipe.ingredients || []);
  return {
    ...recipe,
    totalCost: Number(totalCost.toFixed(4)),
  };
}

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

// Optional filter for list endpoints; intentionally minimal — extend when
// search/filter UI lands.
async function getAllRecipes(organizationId, { categoryId, status } = {}) {
  const recipes = await prisma.recipe.findMany({
    where: {
      organizationId,
      ...(categoryId && { categoryId }),
      ...(status && { status }),
    },
    include: RECIPE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return recipes.map(formatRecipe);
}

// get recipe by id, scoped by organizationId
async function getRecipeById(id, organizationId) {
  const recipe = await prisma.recipe.findFirst({
    where: { id, organizationId },
    include: RECIPE_INCLUDE,
  });
  return formatRecipe(recipe);
}

// Verify that every referenced FK (category, each ingredient, each step's
// role) belongs to the same organization. Throws on the first violation so
// the controller can return 400 — without this, Prisma would happily
// persist cross-tenant links via raw IDs in req.body.
async function assertTenantOwnership(organizationId, { categoryId, ingredientIds, roleIds }) {
  // check categoryId in orgnazation, if provided
  if (categoryId) {
    const found = await prisma.recipeCategory.findFirst({
      where: { 
        id: categoryId, 
        organizationId },

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
    roleId: step.roleId,
    titleAr: step.titleAr,
    titleEn: step.titleEn,
    descriptionAr: step.descriptionAr,
    descriptionEn: step.descriptionEn,
    imageUrl: step.imageUrl,
    videoUrl: step.videoUrl,
  }));
}

// Create a recipe together with its ingredient lines and steps in a single
// transaction. Splitting this into multiple queries would leave orphan
// recipes on partial failure.
async function createRecipe(data, organizationId, createdBy) {
  const { ingredients, steps, categoryId, ...recipeFields } = data;

  const ingredientIds = ingredients ? [...new Set(ingredients.map((l) => l.ingredientId))] : [];
  const roleIds = steps ? steps.map((s) => s.roleId) : [];
  await assertTenantOwnership(organizationId, { categoryId, ingredientIds, roleIds });

  const ingredientLines = buildIngredientLines(ingredients);
  const stepLines = buildStepLines(steps);

  const created = await prisma.recipe.create({
    data: {
      ...recipeFields,
      organizationId,
      createdBy,
      categoryId,
      ingredients: { create: ingredientLines },
      steps: { create: stepLines },
    },
    include: RECIPE_INCLUDE,
  });
  return formatRecipe(created);
}

// Partial update. Any of {ingredients, steps} may be omitted to leave the
// existing lines untouched; when present, the array REPLACES the prior
// lines (deleteMany + create). This matches the partial-update convention
// used by the other modules rather than diff-merge.
async function updateRecipe(id, data, organizationId) {
  const { ingredients, steps, ...recipeFields } = data; // يتم تخزين ٣ متغيرات

  let ingredientIds; // مصفوفة لتخزين معرفات المكونات
  
// هنا يتم التحقق من تعديل المكونات, ثم يتم الدخول وإضافة التعديلات الى مصفوفة معرفات المكونات, بدون تكرار
  if (ingredients) {
    ingredientIds = [...new Set(ingredients.map((l) => l.ingredientId))];
  }
  const roleIds = steps ? steps.map((s) => s.roleId) : [];
  await assertTenantOwnership(organizationId, {
    categoryId: recipeFields.categoryId,
    ingredientIds,
    roleIds,
  });

  const ingredientLines = ingredients ? buildIngredientLines(ingredients) : undefined;
  const stepLines = steps ? buildStepLines(steps) : undefined;

  try {
    const updated = await prisma.recipe.update({
      where: { id, organizationId },
      data: {
        ...recipeFields,
        ...(ingredientLines && {ingredients: { deleteMany: {}, create: ingredientLines },}),
        ...(stepLines && {steps: { deleteMany: {}, create: stepLines },}),
      },
      include: RECIPE_INCLUDE,
    });
    return formatRecipe(updated);
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("Recipe not found or access denied");
    }
    throw error;
  }
}

async function deleteRecipe(id, organizationId) {
  try {
    return await prisma.recipe.delete({
      where: { id, organizationId },
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("Recipe not found or access denied");
    }
    throw error;
  }
}

module.exports = {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
