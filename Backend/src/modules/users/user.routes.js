const express = require("express");
const controller = require("./user.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");
const PERMISSIONS = require("../../constants/permissions");
const router = express.Router();

router.use(authMiddleware);

router.get("/", requirePermission(PERMISSIONS.USERS_VIEW), controller.list);
router.get("/:id", requirePermission(PERMISSIONS.USERS_VIEW), controller.get);
router.post("/", requirePermission(PERMISSIONS.USERS_MANAGE), controller.create);
router.put("/:id", requirePermission(PERMISSIONS.USERS_MANAGE), controller.update);
router.delete("/:id", requirePermission(PERMISSIONS.USERS_MANAGE), controller.remove);

module.exports = router;
