const { z } = require("zod");

// One line of a recipe's ingredient list. usageUnit + usageUnitCost are
// required — the client is expected to send the real cost (e.g. derived
// from Ingredient.costPerStorageUnit × conversionFactor upstream). The
// service will not silently substitute values from the live Ingredient
// row, so historical cost accuracy is fully the caller's responsibility.
const recipeIngredientLineSchema = z.object({
  ingredientId: z.string().uuid("ingredientId must be a valid UUID"),
  quantity: z.number().positive("Quantity must be positive"),
  usageUnit: z.string().trim().min(1, "usageUnit is required"),
  usageUnitCost: z.number().nonnegative("usageUnitCost must be non-negative"),
});

// One preparation step. stepOrder is the only field the controller trusts
// from the client for ordering — the service will sort again on read just
// in case, but ordering input is not server-derived.
const recipeStepSchema = z.object({
  stepOrder: z.number().int().nonnegative("stepOrder must be a non-negative integer"),
  roleIds: z.array(z.string().uuid()).nonempty("At least one role is required"),
  titleAr: z.string().trim().min(1, "Arabic title is required"),
  titleEn: z.string().trim().min(1, "English title is required"),
  descriptionAr: z.string().trim().min(1, "Arabic description").optional(),
  descriptionEn: z.string().trim().min(1, "English description").optional(),
  imageUrl: z.string().url("imageUrl must be a valid URL").optional(),
  videoUrl: z.string().url("videoUrl must be a valid URL").optional(),
});

// Top-level recipe. notes is optional on the recipe itself (steps carry
// their own media). ingredients + steps are required on create — a recipe
// with no ingredients or no preparation steps isn't a recipe. On the
// partial (PUT) path the controller will .partial() everything uniformly,
// so absence means "don't touch" rather than "required".
const recipeSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required"),
  nameAr: z.string().trim().min(1, "Arabic name is required"),
  nameEn: z.string().trim().min(1, "English name is required"),
  categoryId: z.string().uuid("categoryId must be a valid UUID"),
  yieldQuantity: z.number().positive("yieldQuantity must be positive"),
  yieldUnit: z.string().trim().min(1, "yieldUnit is required"),
  notes: z.string().trim().optional(),
  ingredients: z.array(recipeIngredientLineSchema).min(1, "At least one ingredient is required").optional(),
  steps: z.array(recipeStepSchema).min(1, "At least one step is required").optional(),
  status: z.string().trim()
});

module.exports = {
  recipeSchema,
  recipeIngredientLineSchema,
  recipeStepSchema,
};
