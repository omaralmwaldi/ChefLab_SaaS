const prisma = require("../../config/prisma");
const { RECIPE_INCLUDE } = require("./recipe.constants");
const {
  formatRecipe,
  assertTenantOwnership,
  buildIngredientLines,
  buildSubRecipeLines,
  buildStepLines,
  checkForCycles,
} = require("./recipe.helpers");

// Collect all unique user IDs referenced across recipes and return a
// { [userId]: name } map. Recipes that reference deleted users will have
// no entry for that ID — callers handle that with "Deleted User".
async function buildUserMap(userIds) {
  // create array named unique, which contains all unique user
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return {};
  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true },
  });
  return Object.fromEntries(users.map((u) => [u.id, u.name]));
}

// Attach createdByUser / lastEditedByUser metadata to a single recipe or
// an array of recipes. Each user entry is { name } — null name means the
// user was deleted.
async function enrichWithUserData(input) {
  const single = !Array.isArray(input);
  const recipes = single ? [input] : input;
  if (recipes.length === 0) return single ? null : [];

  const userIds = recipes.flatMap((r) => [r.createdBy, r.lastEditedBy]);
  const userMap = await buildUserMap(userIds);

  const enriched = recipes.map((recipe) => ({
    ...recipe,
    createdByUser: recipe.createdBy
      ? { name: userMap[recipe.createdBy] || null }
      : null,
    lastEditedByUser: recipe.lastEditedBy
      ? { name: userMap[recipe.lastEditedBy] || null }
      : null,
  }));

  return single ? enriched[0] : enriched;
}

// Optional filter for list endpoints; intentionally minimal — extend when
// search/filter UI lands.
async function getAllRecipes(organizationId, { categoryId, status, q, limit } = {}) {
  const recipes = await prisma.recipe.findMany({
    where: {
      organizationId,
      ...(categoryId && { categoryId }),
      ...(status && { status }),
      ...(q && {
        OR: [
          { nameEn: { contains: q, mode: "insensitive" } },
          { nameAr: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    include: RECIPE_INCLUDE,
    orderBy: { createdAt: "desc" },
    ...(limit && { take: limit }),
  });
  const formatted = recipes.map(formatRecipe);
  return enrichWithUserData(formatted);
}

async function getRecipeById(id, organizationId) {
  const recipe = await prisma.recipe.findFirst({
    where: { id, organizationId },
    include: RECIPE_INCLUDE,
  });
  if (!recipe) return null;
  return enrichWithUserData(formatRecipe(recipe));
}

// Create a recipe together with its ingredient lines and steps in a single
// transaction. Splitting this into multiple queries would leave orphan
// recipes on partial failure.
async function createRecipe(data, organizationId, createdBy) {
  const { ingredients, steps, categoryId, ...recipeFields } = data;

  // Separate ingredient lines from sub-recipe lines
  const regularIngredients = ingredients ? ingredients.filter((l) => l.ingredientId) : [];
  const subRecipeIngredients = ingredients ? ingredients.filter((l) => l.subRecipeId) : [];

  const ingredientIds = [...new Set(regularIngredients.map((l) => l.ingredientId))];
  const subRecipeIds = [...new Set(subRecipeIngredients.map((l) => l.subRecipeId))];

  // Reject duplicate sub-recipe links before they reach the unique constraint
  if (subRecipeIngredients.length > subRecipeIds.length) {
    throw new Error("Duplicate sub-recipe link");
  }

  const roleIds = steps ? steps.flatMap((s) => s.roleIds) : [];
  await assertTenantOwnership(organizationId, { categoryId, ingredientIds, subRecipeIds, roleIds });

  // Derive server-computed values for sub-recipe lines, then build all lines
  const derivedSubLines = subRecipeIngredients.length > 0
    ? await buildSubRecipeLines(subRecipeIngredients, organizationId)
    : [];
  const ingredientLines = buildIngredientLines([...regularIngredients, ...derivedSubLines]);
  const stepLines = buildStepLines(steps);

  const now = new Date();
  const created = await prisma.recipe.create({
    data: {
      ...recipeFields,
      organizationId,
      createdBy,
      lastEditedBy: createdBy,
      lastEditedAt: now,
      categoryId,
      ingredients: { create: ingredientLines },
      steps: { create: stepLines },
    },
    include: RECIPE_INCLUDE,
  });
  return enrichWithUserData(formatRecipe(created));
}

// Partial update. Any of {ingredients, steps} may be omitted to leave the
// existing lines untouched; when present, the array REPLACES the prior
// lines (deleteMany + create). This matches the partial-update convention
// used by the other modules rather than diff-merge.
async function updateRecipe(id, data, organizationId, userId) {
  const { ingredients, steps, ...recipeFields } = data;

  if (recipeFields.yieldUnit !== undefined) {
    const current = await prisma.recipe.findFirst({
      where: { id, organizationId },
      select: { yieldUnit: true },
    });
    if (!current) {
      throw new Error("Recipe not found or access denied");
    }
    if (current.yieldUnit !== recipeFields.yieldUnit) {
      const link = await prisma.recipeIngredient.findFirst({
        where: { subRecipeId: id },
        select: { id: true },
      });
      if (link) {
        throw new Error(
          "Cannot change yieldUnit: this recipe is used as a sub-recipe in other recipes. Detach the sub-recipe links before editing yieldUnit.",
        );
      }
    }
  }

  let ingredientIds, subRecipeIds, ingredientLines;
  if (ingredients) {
    const regularIngredients = ingredients.filter((l) => l.ingredientId);
    const subRecipeIngredients = ingredients.filter((l) => l.subRecipeId);
    ingredientIds = [...new Set(regularIngredients.map((l) => l.ingredientId))];
    subRecipeIds = [...new Set(subRecipeIngredients.map((l) => l.subRecipeId))];

    const derivedSubLines = subRecipeIngredients.length > 0
      ? await buildSubRecipeLines(subRecipeIngredients, organizationId)
      : [];
    ingredientLines = buildIngredientLines([...regularIngredients, ...derivedSubLines]);
  }
  const roleIds = steps ? steps.flatMap((s) => s.roleIds) : [];
  await assertTenantOwnership(organizationId, {
    categoryId: recipeFields.categoryId,
    ingredientIds,
    subRecipeIds,
    roleIds,
  });

  // Run cycle detection only for newly introduced sub-recipe links.
  // The existing links are already in the DB, so the BFS would see the
  // current recipe as a parent of its own sub-recipes and false-positive.
  if (ingredients && subRecipeIds && subRecipeIds.length > 0) {
    const existingLinks = await prisma.recipeIngredient.findMany({
      where: { recipeId: id, subRecipeId: { not: null } },
      select: { subRecipeId: true },
    });
    const existingSubRecipeIds = new Set(existingLinks.map((l) => l.subRecipeId));
    const newSubRecipeIds = subRecipeIds.filter((srId) => !existingSubRecipeIds.has(srId));
    if (newSubRecipeIds.length > 0) {
      await checkForCycles(id, newSubRecipeIds);
    }
  }

  const stepLines = steps ? buildStepLines(steps) : undefined;

  try {
    const updated = await prisma.recipe.update({
      where: { id, organizationId },
      data: {
        ...recipeFields,
        lastEditedBy: userId,
        lastEditedAt: new Date(),
        ...(ingredientLines && {
          ingredients: { deleteMany: {}, create: ingredientLines },
        }),
        ...(stepLines && {
          steps: { deleteMany: {}, create: stepLines },
        }),
      },
      include: RECIPE_INCLUDE,
    });
    return enrichWithUserData(formatRecipe(updated));
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
    if (error.code === "P2003") {
      throw new Error(
        "Cannot delete recipe: it is used as a sub-recipe in other recipes. Detach the sub-recipe links before deleting.",
      );
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
