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

module.exports = {
  login,
};