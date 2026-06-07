function toAuthUser(user) {
  return {
    id: user.id,
    organizationId: user.organizationId,
    roleId: user.roleId,

    name: user.name,
    email: user.email,

    role: user.role
  };
}

module.exports = {
  toAuthUser,
};