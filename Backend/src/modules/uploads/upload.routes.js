const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const { signSchema } = require("./upload.validation");
const { signUpload } = require("./upload.service");
const { r2Ready } = require("../../config/r2");

const router = express.Router();
router.use(authMiddleware);

// POST /uploads/sign — returns a presigned R2 PUT URL.
// Body: { contentType, sizeBytes, kind: 'image' | 'video' }
router.post("/sign", async (req, res, next) => {
    try {
      if (!r2Ready()) {
        return res.status(503).json({
          message: "Upload service not configured (R2 env vars missing).",
        });
      }

      const parsed = signSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid request",
          errors: parsed.error.issues,
        });
      }

      const { contentType, sizeBytes, kind } = parsed.data;
      const result = await signUpload({
        organizationId: req.user.organizationId,
        contentType,
        sizeBytes,
        kind,
      });
      res.json(result);
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ message: err.message });
      }
      next(err);
    }
  },
);

module.exports = router;
