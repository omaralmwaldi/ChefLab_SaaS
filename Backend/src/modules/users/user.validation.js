const { z } = require("zod");

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().optional().nullable(),
  password: z.string().trim().min(8, "Password must be at least 8 characters long"),
  roleId: z.string().uuid("Invalid role ID").optional().nullable(),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  email: z.string().trim().email("Invalid email address").optional(),
  phone: z.string().trim().optional().nullable(),
  roleId: z.string().uuid("Invalid role ID").optional().nullable(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
