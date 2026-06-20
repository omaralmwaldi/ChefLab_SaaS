const { z } = require("zod");

const passwordRule = z
  .string()
  .trim()
  .min(10, "Password must be at least 10 characters long")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/, "Password must contain a special character");

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().optional().nullable(),
  password: passwordRule,
  roleId: z.string().uuid("Invalid role ID").optional().nullable(),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  email: z.string().trim().email("Invalid email address").optional(),
  phone: z.string().trim().optional().nullable(),
  password: passwordRule.optional(),
  roleId: z.string().uuid("Invalid role ID").optional().nullable(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
