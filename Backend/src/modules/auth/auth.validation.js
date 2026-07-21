const { z } = require("zod");
const { passwordRule } = require("../users/user.validation");

const languageSchema = z.object({
  preferredLanguage: z.enum(["en", "ar"]),
});

// Signup reuses passwordRule as the single source of password truth.
// confirmPassword must equal password and is never persisted.
const signupSchema = z
  .object({
    organizationName: z.string().trim().min(1, "Organization name is required"),
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("Invalid email address"),
    password: passwordRule,
    confirmPassword: z.string(),
    preferredLanguage: z.enum(["en", "ar"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

module.exports = { languageSchema, signupSchema };
