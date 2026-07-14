const express = require("express");
const router = express.Router();
const controller = require("./permission.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.use(authMiddleware);

router.get("/", controller.getCatalog);

module.exports = router;
