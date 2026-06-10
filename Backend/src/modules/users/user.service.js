const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");

// get all users for an organization
async function getAllUsers(organizationId) {
  return await prisma.user.findMany({
    where: { organizationId },
    include: {
      role: true,
    },
  });
}


async function getUserById(id, organizationId) {
  return await prisma.user.findFirst({
    where: { id, organizationId },
    include: {
      role: true,
    },
  });
}

async function createUser(data, organizationId) {
  const { password, ...userData } = data; // Extract password for hashing

  const passwordHash = await bcrypt.hash(password, 10);// Hash the password before storing

  return await prisma.user.create({
    data: {
      ...userData,
      passwordHash,
      organizationId,
    },
    include: {
      role: true,
    },
  });
}

async function updateStaff(id, data, organizationId) {
  const existing = await prisma.user.findFirst({
    where: { id, organizationId },
  });

  if (!existing) {
    throw new Error("User not found or access denied");
  }

  const { password, ...updateData } = data;

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  return await prisma.user.update({
    where: { id },
    data: updateData,
    include: {
      role: true,
    },
  });
}

async function deleteStaff(id, organizationId) {
  try {
    await prisma.user.deleteMany({
      where: { id, organizationId },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error("User not found");
    }
    throw error;
  }
}

module.exports = {
  getAllUsers,
  getStaffById: getUserById,
  createStaff: createUser,
  updateStaff,
  deleteStaff,
};
