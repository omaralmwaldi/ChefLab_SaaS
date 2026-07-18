const prisma = require("../../config/prisma");

async function getAllRoles(organizationId) {
  return await prisma.role.findMany({
    where: { organizationId },
  });
}

async function getRoleById(roleId, organizationId) {
    const role = await prisma.role.findFirst({
        where: {
            id: roleId,
            organizationId,
        },
    });

    if (!role) {
        throw new Error("Role not found");
    }

    return role;
}

async function createRole(data){
    return await prisma.role.create({
        data: {
            organizationId: data.organizationId,
            nameAr: data.nameAr,
            nameEn: data.nameEn,
            permissions: data.permissions,
        },
    });
}

// Self-guard: a roles.manage holder may not edit or delete the role assigned to
// their own account. The owner (isOwner, holds no role) bypasses this.
function assertNotOwnRole(roleId, actor) {
    if (actor?.isOwner) return;
    if (actor?.currentUserRoleId && actor.currentUserRoleId === roleId) {
        const err = new Error("Cannot modify your own role");
        err.code = "SELF_ROLE_GUARD";
        throw err;
    }
}

async function updateRole(roleId, organizationId, data, actor){
    assertNotOwnRole(roleId, actor);
    await getRoleById(roleId, organizationId);
    return await prisma.role.update({
        where: { id: roleId },
        data: {
            nameAr: data.nameAr,
            nameEn: data.nameEn,
            permissions: data.permissions,
        },
    });
}

async function deleteRole(roleId, organizationId, actor){
    assertNotOwnRole(roleId, actor);
    // Ownership check only; deletion always proceeds. onDelete rules handle the
    // rest: User.roleId → SetNull, RecipeStepRole → Cascade (steps survive).
    await getRoleById(roleId, organizationId);
    await prisma.role.delete({
        where: { id: roleId },
    });
}


module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};