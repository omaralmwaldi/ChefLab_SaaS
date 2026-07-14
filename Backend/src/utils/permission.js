const prisma = require("../config/prisma");

// True if the request belongs to the organization owner. Read fresh from the
// database, then cached on req for the lifetime of the request.
async function isOwner(req) {
  if (typeof req.isOwner === "boolean") {
    return req.isOwner;
  }

  const org = await prisma.organization.findUnique({
    where: { id: req.user.organizationId },
    select: { ownerUserId: true },
  });

  req.isOwner = !!org && org.ownerUserId === req.user.userId;
  return req.isOwner;
}

// The role's granted-permissions array, scoped by (id, organizationId).
// Cached on req. Owner (no role) or missing role → empty array.
async function getGrantedPermissions(req) {
  if (req.grantedPermissions) {
    return req.grantedPermissions;
  }

  if (!req.user.roleId) {
    req.grantedPermissions = [];
    return req.grantedPermissions;
  }

  const role = await prisma.role.findUnique({
    where: {
      id_organizationId: {
        id: req.user.roleId,
        organizationId: req.user.organizationId,
      },
    },
    select: { permissions: true },
  });

  req.grantedPermissions = Array.isArray(role?.permissions)
    ? role.permissions
    : [];
  return req.grantedPermissions;
}

// Single permission decision point: true for the owner on any key, otherwise
// whether the role's granted array contains the key.
async function hasPermission(req, key) {
  if (await isOwner(req)) {
    return true;
  }

  const granted = await getGrantedPermissions(req);
  return granted.includes(key);
}

module.exports = { hasPermission, isOwner, getGrantedPermissions };
