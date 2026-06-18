const { z } = require("zod");

const roleSchema = z.object({
  nameAr: z.string().trim().min(1, "Arabic name is required"),
  nameEn: z.string().trim().min(1, "English name is required"),
  permissions: z.record(z.boolean(), "Permissions must be an object of booleans"),
});

module.exports = { roleSchema };
