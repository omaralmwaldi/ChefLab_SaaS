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



// create function returnRole that return role entity with permissions as array of strings
module.exports = {
  toAuthUser,
};