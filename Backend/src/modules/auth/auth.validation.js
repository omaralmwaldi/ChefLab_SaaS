const { z } = require("zod");

const languageSchema = z.object({
  preferredLanguage: z.enum(["en", "ar"]),
});

module.exports = { languageSchema };
