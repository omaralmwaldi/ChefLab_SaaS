const { z } = require("zod");

const categorySchema = z.object({
  sku: z.string().trim().min(1, "SKU is required"),
  nameAr: z.string().trim().min(1, "Arabic name is required"),
  nameEn: z.string().trim().min(1, "English name is required"),
});

module.exports = {
  categorySchema,
};
