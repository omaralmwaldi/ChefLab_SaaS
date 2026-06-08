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

async function updateRole(roleId, organizationId, data){
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

async function deleteRole(roleId, organizationId){
    const role = await prisma.role.findFirst({
        where: {
            id: roleId,
            organizationId,
        },
        include: { users: true },
    });
    if (!role) {
        throw new Error("Role not found");
    }
    if (role.users.length > 0) {
        throw new Error("Cannot delete role with assigned users");
    }
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