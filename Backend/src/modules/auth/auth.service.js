const bcrypt = require("bcrypt");
const { generateToken } = require("../../utils/jwt");
const prisma = require("../../config/prisma");
const {toAuthUser} = require("./auth.mapper");

async function login(email, password) {
  const user =
    await prisma.user.findFirst({
      where: {
        email,
      },
      include: {
        role: true,
        organization: { select: { ownerUserId: true } },
      },
    });

  if (!user) {
    throw new Error(
      "Invalid email or password"
    );
  }

  const validPassword =
    await bcrypt.compare(
      password,
      user.passwordHash
    );

  if (!validPassword) {
    throw new Error(
      "Invalid email or password"
    );
  }

  const token =
    generateToken({
      userId: user.id, 
      organizationId: user.organizationId, 
      roleId: user.roleId,
    });

  return {
    token,
    user: toAuthUser(user),
  };
}

// Atomic tenant creation: org (ownerUserId=null) -> first user (roleId=null) ->
// set org.ownerUserId. Response matches login shape via toAuthUser (isOwner=true).
async function signup({ organizationName, name, email, password, preferredLanguage }) {
  // create hashed password for the new user
  const passwordHash = await bcrypt.hash(password, 10);

  // identification user
  let newUserId;
  try {
    // Use a transaction to ensure of organization and user creation
    newUserId = await prisma.$transaction(async (tx) => {
      // create organization with ownerUserId=null
      const organization = await tx.organization.create({
        data: { name: organizationName, ownerUserId: null },
      });
      // create user with roleId=null and link to the organization
      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          roleId: null,
          name,
          email,
          passwordHash,
          preferredLanguage,
        },
      });
      // update organization with ownerUserId=user.id
      await tx.organization.update({
        where: { id: organization.id },
        data: { ownerUserId: user.id },
      });

      return user.id;
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new Error("Email already registered");
    }
    throw error;
  }
  // fetch the newly created user with role and organization details
  const user = await prisma.user.findUnique({
    where: { id: newUserId },
    include: {
      role: true,
      organization: { select: { ownerUserId: true } },
    },
  });

  const token = generateToken({
    userId: user.id,
    organizationId: user.organizationId,
    roleId: user.roleId,
  });

  return { token, user: toAuthUser(user) };
}

async function currentUser(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            role: true,
            organization: { select: { ownerUserId: true } },
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    return toAuthUser(user);
}

async function updateLanguage(userId, preferredLanguage) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { preferredLanguage },
    include: { role: true, organization: { select: { ownerUserId: true } } },
  });
  return toAuthUser(user);
}

module.exports = {
    login,
    signup,
    currentUser,
    updateLanguage,
};