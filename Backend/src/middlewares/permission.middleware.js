const prisma = require("../config/prisma");

function checkPermission(permission) {
  return async function (
    req,
    res,
    next
  ) {
    try {
      const user =
        await prisma.user.findUnique({
          where: {
            id: req.user.userId,
          },

          include: {
            role: true,
          },
        });

      if (!user) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      const permissions =
        user.role.permissions;

      if (
        !permissions?.[permission]
      ) {
        return res.status(403).json({
          message: "Forbidden",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        message:
          "Permission check failed",
      });
    }
  };
}

module.exports =
  checkPermission;