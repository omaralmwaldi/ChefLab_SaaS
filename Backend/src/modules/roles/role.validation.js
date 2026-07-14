const { z } = require("zod");

const roleSchema = z.object({
  nameAr: z.string().trim().min(1, "Arabic name is required"),
  nameEn: z.string().trim().min(1, "English name is required"),
  permissions: z.array(z.string(), "Permissions must be an array of permission keys"),
});

module.exports = { roleSchema };
