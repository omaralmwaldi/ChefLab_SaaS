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
  try {
    return await prisma.recipeCategory.create({
      data: {
        ...data,
        organizationId,
      },
    });
  } catch (error) {
    if (error.code === "P2002") throw new Error("SKU already exists");
    throw error;
  }
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
    if (error.code === "P2002") throw new Error("SKU already exists");
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

async function getNextSku(organizationId) {
  const rows = await prisma.recipeCategory.findMany({
    where: { organizationId },
    select: { sku: true },
  });
  const nums = rows
    .map((r) => r.sku)
    .filter((s) => /^SK-\d{4}$/.test(s))
    .map((s) => parseInt(s.slice(3), 10));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  if (next > 9999) throw new Error("SKU namespace full");
  return "SK-" + String(next).padStart(4, "0");
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getNextSku,
};
