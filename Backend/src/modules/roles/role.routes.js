// create routes for roles
const express = require("express");
const router = express.Router();
const controller = require("./role.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.use(authMiddleware);

router.get("/", controller.getAllRoles);
router.get("/:id", controller.getRoleById);
router.post("/", controller.createRole);
router.put("/:id", controller.updateRole);
router.delete("/:id", controller.deleteRole);
module.exports = router;