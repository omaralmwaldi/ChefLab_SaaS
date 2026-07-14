const { hasPermission } = require("../utils/permission");

function requirePermission(permissionKey) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (await hasPermission(req, permissionKey)) {
        return next();
      }

      return res.status(403).json({ message: "Forbidden" });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
}

module.exports = { requirePermission };
