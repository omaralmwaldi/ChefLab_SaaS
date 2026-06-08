const prisma = require("../config/prisma");

function checkPermission(permission) {
  if (!permission) {
    return res.status(500).json({
      message: "Permission not configured",
    });
  }
  return async function (req, res, next) {
    try {
      // extract user information from the request object
      const user =
        await prisma.user.findUnique({
          where: {
            id: req.user.userId,
          },

          include: {
            role: true,
          },
        });

      // if the user is not found:
      if (!user) {
        return res.status(401).json({
          message: "User not found",
        });
      }

      // extract the permissions from the user's role
      const permissions =
        user.role?.permissions || [];


      // check if the required permission is included in the user's permissions
      if (!permissions.includes(permission)) {
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