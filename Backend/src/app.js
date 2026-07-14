const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const roleRoutes = require("./modules/roles/role.routes");
const ingredientRoutes = require("./modules/ingredients/ingredient.routes");
const categoryRoutes = require("./modules/categories/category.routes");
const recipeRoutes = require("./modules/recipes/recipe.routes");
const uploadRoutes = require("./modules/uploads/upload.routes");
const permissionRoutes = require("./modules/permissions/permission.routes");

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/roles", roleRoutes);
app.use("/ingredients", ingredientRoutes);
app.use("/categories", categoryRoutes);
app.use("/recipes", recipeRoutes);
app.use("/uploads", uploadRoutes);
app.use("/permissions", permissionRoutes);

module.exports = app;