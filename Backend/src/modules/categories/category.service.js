const prisma = require("../../config/prisma");

// get all categories for the organization
async function getAllCategories(organizationId) {
  return await prisma.recipeCategory.findMany({
    where: { organizationId },
  });
}

// get a single category by ID for the organization
async function getCategoryById(id, organizationId) {
  return await prisma.recipeCategory.findFirst({
    where: { id, organizationId },
  });
}

// create a new category for the organization
async function createCategory(data, organizationId) {
  return await prisma.recipeCategory.create({
    data: {
      ...data,
      organizationId,
    },
  });
}

// update an existing category by ID with error handling for not found or access denied cases
async function updateCategory(id, data, organizationId) {
  try {
    return await prisma.recipeCategory.update({
      where: { id, organizationId },
      data,
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("Category not found or access denied");
    }
    throw error;
  }

}

// delete a category by ID with error handling for not found or access denied cases
async function deleteCategory(id, organizationId) {
  try {
    return await prisma.recipeCategory.delete({
      where: { id, organizationId },
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("Category not found or access denied");
    }
    throw error;
  }
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
