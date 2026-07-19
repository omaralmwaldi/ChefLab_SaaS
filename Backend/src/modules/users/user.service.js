const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");

// get all users for the organization; each row tagged with isOwner so the UI
// can hide edit/delete controls on the owner record for non-owner actors.
async function getAllUsers(organizationId) {
  const [users, ownerUserId] = await Promise.all([
    prisma.user.findMany({
      where: { organizationId },
      include: { role: true },
    }),
    getOwnerUserId(organizationId),
  ]);
  return users.map((u) => ({ ...u, isOwner: u.id === ownerUserId }));
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

// The organization owner's user id, or null. Owner is identified via Organization.ownerUserId.
async function getOwnerUserId(organizationId) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { ownerUserId: true },
  });
  return org?.ownerUserId ?? null;
}

// update an existing user by ID; if a password is provided, rehash it. P2025 means "not found or cross-tenant".
// Owner protection: only the owner may edit the owner record. Self-guard: a non-owner cannot change their own role.
async function updateUser(id, data, organizationId, actor) {
  const ownerUserId = await getOwnerUserId(organizationId);

  // Only the owner may edit the owner's record; any other actor is refused.
  if (ownerUserId && id === ownerUserId && actor.userId !== ownerUserId) {
    const err = new Error("Cannot edit the organization owner");
    err.code = "OWNER_PROTECTED";
    throw err;
  }

  // A non-owner acting on their own record may not alter their own role.
  if (actor.userId === id && !actor.isOwner && "roleId" in data) {
    const current = await prisma.user.findFirst({
      where: { id, organizationId },
      select: { roleId: true },
    });
    // this guard is only triggered if the roleId is actually changing; if it's the same, it's allowed.
    if (current && current.roleId !== (data.roleId ?? null)) {
      const err = new Error("Cannot change your own role");
      err.code = "SELF_ROLE_ASSIGN_GUARD";
      throw err;
    }
  }

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
// Owner protection: the owner record can never be deleted, by anyone including the owner.
// Self protection: no user may delete their own account.
async function deleteUser(id, organizationId, actor) {
  const ownerUserId = await getOwnerUserId(organizationId);
  if (ownerUserId && id === ownerUserId) {
    const err = new Error("The organization owner cannot be deleted");
    err.code = "OWNER_PROTECTED";
    throw err;
  }

  if (actor && id === actor.userId) {
    const err = new Error("You cannot delete your own account");
    err.code = "SELF_DELETE_GUARD";
    throw err;
  }

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
