const express = require("express");
const app = express();
app.use(express.json());
const authRoutes = require("./modules/auth/auth.routes");
const roleRoutes = require("./modules/roles/role.routes");

app.use("/auth", authRoutes);
app.use("/roles", roleRoutes);

module.exports = app;