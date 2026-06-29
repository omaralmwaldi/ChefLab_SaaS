const { z } = require("zod");

const ingredientSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required"),
  nameAr: z.string().trim().min(1, "Arabic name is required"),
  nameEn: z.string().trim().min(1, "English name is required"),
  storageUnit: z.string().trim().min(1, "Storage unit is required"),
  usageUnit: z.string().trim().min(1, "Usage unit is required"),
  conversionFactor: z.number().positive("Conversion factor must be positive"),
  costPerStorageUnit: z.number().nonnegative("Cost must be non-negative"),
  calories: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
});

// Row schema for Excel imports. Cells arrive as strings, so numerics use
// z.coerce.number(). Empty nutrition cells become undefined (= field skipped).
// Reject decimal commas up-front — Gulf locale uses '.' only.
const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? String(v) : v.trim()))
  .refine((v) => v === "" || /^-?\d+(\.\d+)?$/.test(v), {
    message: "Use '.' as decimal separator",
  });

const requiredDecimalString = decimalString.refine((v) => v !== "", {
  message: "Required",
});

// Optional numeric from cell. Empty/null/undefined → undefined (no field).
// Reject decimal commas before coercion.
function optionalNumericFromCell(nonnegative) {
  return z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return undefined;
      const s = typeof v === "number" ? String(v) : String(v).trim();
      if (s === "") return undefined;
      if (!/^-?\d+(\.\d+)?$/.test(s)) {
        return { __invalid: "Use '.' as decimal separator" };
      }
      return s;
    },
    z.unknown().transform((v, ctx) => {
      if (v === undefined) return undefined;
      if (v && typeof v === "object" && v.__invalid) {
        ctx.addIssue({ code: "custom", message: v.__invalid });
        return z.NEVER;
      }
      const n = Number(v);
      if (Number.isNaN(n)) {
        ctx.addIssue({ code: "custom", message: "Must be a number" });
        return z.NEVER;
      }
      return n;
    }).pipe(
      nonnegative
        ? z.number().nonnegative("Must be non-negative").optional()
        : z.number().optional(),
    ),
  );
}

const ingredientRowSchema = z.object({
  sku: z
    .union([z.string(), z.number()])
    .transform((v) => String(v ?? "").trim())
    .refine((v) => v.length > 0, { message: "SKU is required" }),
  nameAr: z
    .union([z.string(), z.number()])
    .transform((v) => String(v ?? "").trim())
    .refine((v) => v.length > 0, { message: "Arabic name is required" }),
  nameEn: z
    .union([z.string(), z.number()])
    .transform((v) => String(v ?? "").trim())
    .refine((v) => v.length > 0, { message: "English name is required" }),
  storageUnit: z
    .union([z.string(), z.number()])
    .transform((v) => String(v ?? "").trim())
    .refine((v) => v.length > 0, { message: "Storage unit is required" }),
  usageUnit: z
    .union([z.string(), z.number()])
    .transform((v) => String(v ?? "").trim())
    .refine((v) => v.length > 0, { message: "Usage unit is required" }),
  conversionFactor: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.coerce.number().positive("Conversion factor must be positive"),
    ),
  costPerStorageUnit: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.coerce.number().nonnegative("Cost must be non-negative"),
    ),
  calories: optionalNumericFromCell(true),
  protein: optionalNumericFromCell(true),
  fat: optionalNumericFromCell(true),
  carbs: optionalNumericFromCell(true),
});

module.exports = {
  ingredientSchema,
  ingredientRowSchema,
  requiredDecimalString,
  decimalString,
};
