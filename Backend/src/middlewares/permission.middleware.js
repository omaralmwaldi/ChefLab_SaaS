const prisma = require("../config/prisma");

function requirePermission(permissionKey) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.roleId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!req.role) {
        const role = await prisma.role.findUnique({
          where: {
            id_organizationId: {
              id: req.user.roleId,
              organizationId: req.user.organizationId,
            },
          },
          select: { permissions: true },
        });

        if (!role) {
          return res.status(403).json({ message: "Forbidden" });
        }

        req.role = role;
      }

      if (!req.role.permissions[permissionKey]) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
}

module.exports = { requirePermission };
