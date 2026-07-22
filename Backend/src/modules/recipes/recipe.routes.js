const express = require("express");
const controller = require("./recipe.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");
const PERMISSIONS = require("../../constants/permissions");
const router = express.Router();

router.use(authMiddleware);

router.get("/", requirePermission(PERMISSIONS.RECIPES_VIEW), controller.list);
router.get("/next-sku", requirePermission(PERMISSIONS.RECIPES_VIEW), controller.getNextSku);
router.get("/authors", requirePermission(PERMISSIONS.RECIPES_VIEW), controller.listAuthors);
router.get("/:id", requirePermission(PERMISSIONS.RECIPES_VIEW), controller.get);
router.post("/", requirePermission(PERMISSIONS.RECIPES_CREATE), controller.create);
router.put("/:id", requirePermission(PERMISSIONS.RECIPES_EDIT), controller.update);
router.delete("/:id", requirePermission(PERMISSIONS.RECIPES_DELETE), controller.remove);

module.exports = router;
