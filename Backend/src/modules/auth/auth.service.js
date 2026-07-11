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

async function currentUser(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            role: true,
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
    include: { role: true },
  });
  return toAuthUser(user);
}

module.exports = {
    login,
    currentUser,
    updateLanguage,
};