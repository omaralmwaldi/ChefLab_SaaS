const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");

// get all users for the organization
async function getAllUsers(organizationId) {
  return await prisma.user.findMany({
    where: { organizationId },
    include: {
      role: true,
    },
  });
}

// get a single user by ID for the organization
async function getUserById(id, organizationId) {
  return await prisma.user.findFirst({
    where: { id, organizationId },
    include: {
      role: true,
    },
  });
}

// create a new user for the organization; hashes the password and maps unique-email conflicts to a friendly error
async function createUser(data, organizationId) {
  const { password, ...userData } = data;

  const passwordHash = await bcrypt.hash(password, 10);

  try {
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
  } catch (error) {
    if (error.code === "P2002") {
      throw new Error("Email already exists");
    }
    throw error;
  }
}

// update an existing user by ID; if a password is provided, rehash it. P2025 means "not found or cross-tenant".
async function updateUser(id, data, organizationId) {
  const { password, ...updateData } = data;

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  try {
    return await prisma.user.update({
      where: { id, organizationId },
      data: updateData,
      include: {
        role: true,
      },
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("User not found or access denied");
    }
    throw error;
  }
}

// delete a user by ID; P2025 means "not found or cross-tenant".
async function deleteUser(id, organizationId) {
  try {
    return await prisma.user.delete({
      where: { id, organizationId },
    });
  } catch (error) {
    if (error.code === "P2025") {
      throw new Error("User not found or access denied");
    }
    throw error;
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
