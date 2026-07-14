function toAuthUser(user) {
  const isOwner =
    !!user.organization && user.organization.ownerUserId === user.id;

  const permissions = isOwner
    ? []: Array.isArray(user.role?.permissions)
    ? user.role.permissions
    : [];

  return {
    id: user.id,
    organizationId: user.organizationId,
    roleId: user.roleId,

    name: user.name,
    email: user.email,
    preferredLanguage: user.preferredLanguage,

    role: user.role,
    isOwner,
    permissions,
  };
}

module.exports = {
  toAuthUser,
};
