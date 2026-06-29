const express = require("express");
const multer = require("multer");
const controller = require("./ingredient.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const { requirePermission } = require("../../middlewares/permission.middleware");
const PERMISSIONS = require("../../constants/permissions");
const router = express.Router();

router.use(authMiddleware);

// In-memory upload for Excel import. Reject non-xlsx mime before the
// buffer is read; cap at 5MB ≈ 50k rows of ingredient data.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.originalname.toLowerCase().endsWith(".xlsx");
    cb(ok ? null : new Error("Only .xlsx files are accepted"), ok);
  },
});

// Multer error → 413/400. Express recognizes the 4-arg signature as
// error-handling middleware.
router.use((err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File exceeds 5MB limit" });
  }
  if (err && err.message === "Only .xlsx files are accepted") {
    return res.status(400).json({ message: err.message });
  }
  return next(err);
});

// Bulk endpoints must be registered BEFORE /:id so the param route
// doesn't swallow them.
router.get(
  "/export",
  requirePermission(PERMISSIONS.INGREDIENTS_VIEW),
  controller.exportIngredients,
);
router.post(
  "/import",
  requirePermission(PERMISSIONS.INGREDIENTS_CREATE),
  upload.single("file"),
  controller.importIngredients,
);

router.get("/", requirePermission(PERMISSIONS.INGREDIENTS_VIEW), controller.list);
router.get("/:id", requirePermission(PERMISSIONS.INGREDIENTS_VIEW), controller.get);
router.post("/", requirePermission(PERMISSIONS.INGREDIENTS_CREATE), controller.create);
router.put("/:id", requirePermission(PERMISSIONS.INGREDIENTS_EDIT), controller.update);
router.delete("/:id", requirePermission(PERMISSIONS.INGREDIENTS_DELETE), controller.remove);

module.exports = router;
