const prisma = require("../../config/prisma");

async function getAllIngredients(organizationId) {
  return await prisma.ingredient.findMany({
    where: { organizationId },
  });
}

async function getIngredientById(id, organizationId) {
  return await prisma.ingredient.findFirst({
    where: { id, organizationId },
  });
}

async function createIngredient(data, organizationId) {
  return await prisma.ingredient.create({
    data: {
      ...data,
      organizationId,
    },
  });
}

//update an existing ingredient by ID
async function updateIngredient(id, data, organizationId) {
  try {
    return await prisma.ingredient.update({
      where: { id, organizationId },
      data,
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("Ingredient not found or access denied");
    }
    throw error;
  }
}

// delete an ingredient by ID with error handling for not found or access denied cases
async function deleteIngredient(id, organizationId) {
  try {
    return await prisma.ingredient.delete({
      where: { id, organizationId },
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("Ingredient not found or access denied");
    }
    throw error;
  }
}

module.exports = {
  getAllIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
};
