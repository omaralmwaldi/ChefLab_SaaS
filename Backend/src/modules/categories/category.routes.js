const express = require("express");
const controller = require("./category.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");
const PERMISSIONS = require("../../constants/permissions");
const router = express.Router();

router.use(authMiddleware);

router.get("/", requirePermission(PERMISSIONS.CATEGORIES_VIEW), controller.list);
router.get("/:id", requirePermission(PERMISSIONS.CATEGORIES_VIEW), controller.get);
router.post("/", requirePermission(PERMISSIONS.CATEGORIES_CREATE), controller.create);
router.put("/:id", requirePermission(PERMISSIONS.CATEGORIES_EDIT), controller.update);
router.delete("/:id", requirePermission(PERMISSIONS.CATEGORIES_DELETE), controller.remove);

module.exports = router;
