// create routes for roles
const express = require("express");
const router = express.Router();
const controller = require("./role.controller");
const authMiddleware = require("../../middlewares/auth.middleware");


router.get("/", authMiddleware, controller.getAllRoles);
router.get("/:id", authMiddleware, controller.getRoleById);
router.post("/", authMiddleware, controller.createRole);
router.put("/:id", authMiddleware, controller.updateRole);
router.delete("/:id", authMiddleware, controller.deleteRole);
module.exports = router;