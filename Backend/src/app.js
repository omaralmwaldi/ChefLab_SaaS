const express = require("express");
const app = express();
app.use(express.json());
const authRoutes = require("./modules/auth/auth.routes");
const roleRoutes = require("./modules/roles/role.routes");
const ingredientRoutes = require("./modules/ingredients/ingredient.routes");
const categoryRoutes = require("./modules/categories/category.routes");

app.use("/auth", authRoutes);
app.use("/roles", roleRoutes);
app.use("/ingredients", ingredientRoutes);
app.use("/categories", categoryRoutes);

module.exports = app;