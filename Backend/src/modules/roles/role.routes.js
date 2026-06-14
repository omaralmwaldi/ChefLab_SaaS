const express = require("express");
const router = express.Router();
const controller = require("./role.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");
const PERMISSIONS = require("../../constants/permissions");

router.use(authMiddleware);

router.get("/", requirePermission(PERMISSIONS.ROLES_VIEW), controller.getAllRoles);
router.get("/:id", requirePermission(PERMISSIONS.ROLES_VIEW), controller.getRoleById);
router.post("/", requirePermission(PERMISSIONS.ROLES_CREATE), controller.createRole);
router.put("/:id", requirePermission(PERMISSIONS.ROLES_EDIT), controller.updateRole);
router.delete("/:id", requirePermission(PERMISSIONS.ROLES_DELETE), controller.deleteRole);

module.exports = router;
