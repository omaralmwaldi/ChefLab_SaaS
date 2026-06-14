const express = require("express");
const controller = require("./ingredient.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");
const PERMISSIONS = require("../../constants/permissions");
const router = express.Router();

router.use(authMiddleware);

router.get("/", requirePermission(PERMISSIONS.INGREDIENTS_VIEW), controller.list);
router.get("/:id", requirePermission(PERMISSIONS.INGREDIENTS_VIEW), controller.get);
router.post("/", requirePermission(PERMISSIONS.INGREDIENTS_CREATE), controller.create);
router.put("/:id", requirePermission(PERMISSIONS.INGREDIENTS_EDIT), controller.update);
router.delete("/:id", requirePermission(PERMISSIONS.INGREDIENTS_DELETE), controller.remove);

module.exports = router;
