const express = require("express");
const controller = require("./auth.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const router = express.Router();
const PERMISSIONS = require("../../constants/permissions");
const permissionMiddleware = require("../../middlewares/permission.middleware");


router.post("/login", controller.login);
router.get("/me", authMiddleware, controller.me);

module.exports = router;