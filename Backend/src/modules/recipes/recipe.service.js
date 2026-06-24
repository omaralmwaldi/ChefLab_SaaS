const prisma = require("../../config/prisma");
const { RECIPE_INCLUDE } = require("./recipe.constants");
const {
  formatRecipe,
  assertTenantOwnership,
  buildIngredientLines,
  buildStepLines,
} = require("./recipe.helpers");

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

async function getRecipeById(id, organizationId) {
  const recipe = await prisma.recipe.findFirst({
    where: { id, organizationId },
    include: RECIPE_INCLUDE,
  });
  return formatRecipe(recipe);
}

// Create a recipe together with its ingredient lines and steps in a single
// transaction. Splitting this into multiple queries would leave orphan
// recipes on partial failure.
async function createRecipe(data, organizationId, createdBy) {
  const { ingredients, steps, categoryId, ...recipeFields } = data;

  const ingredientIds = ingredients ? [...new Set(ingredients.map((l) => l.ingredientId))] : [];
  const roleIds = steps ? steps.flatMap((s) => s.roleIds) : [];
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
  const { ingredients, steps, ...recipeFields } = data;

  let ingredientIds;
  if (ingredients) {
    ingredientIds = [...new Set(ingredients.map((l) => l.ingredientId))];
  }
  const roleIds = steps ? steps.flatMap((s) => s.roleIds) : [];
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
        ...(ingredientLines && {
          ingredients: { deleteMany: {}, create: ingredientLines },
        }),
        ...(stepLines && {
          steps: { deleteMany: {}, create: stepLines },
        }),
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
