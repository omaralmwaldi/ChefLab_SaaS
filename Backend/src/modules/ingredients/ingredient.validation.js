const { z } = require("zod");

const ingredientSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  nameAr: z.string().min(1, "Arabic name is required"),
  nameEn: z.string().min(1, "English name is required"),
  storageUnit: z.string().min(1, "Storage unit is required"),
  usageUnit: z.string().min(1, "Usage unit is required"),
  conversionFactor: z.number().positive("Conversion factor must be positive"),
  costPerStorageUnit: z.number().nonnegative("Cost must be non-negative"),
  calories: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
});

module.exports = {
  ingredientSchema,
};
