const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Organization
  const organization = await prisma.organization.create({
    data: {
      name: "ChefLab Demo",
    },
  });

  // Roles
  const adminRole = await prisma.role.create({
    data: {
      organizationId: organization.id,
      nameAr: "مدير النظام",
      nameEn: "Admin",
      permissions: {
        users: true,
        roles: true,
        recipes: true,
        ingredients: true,
      },
    },
  });

  await prisma.role.create({
    data: {
      organizationId: organization.id,
      nameAr: "شيف",
      nameEn: "Chef",
      permissions: {},
    },
  });

  await prisma.role.create({
    data: {
      organizationId: organization.id,
      nameAr: "موظف مطبخ",
      nameEn: "Kitchen Staff",
      permissions: {},
    },
  });

  // Password Hash
  const passwordHash = await bcrypt.hash("12345678@Om", 10);

  // Admin User
  await prisma.user.create({
    data: {
      organizationId: organization.id,
      roleId: adminRole.id,

      name: "System Admin",

      email: "omar156.mh@gmail.com",

      passwordHash,
    },
  });

  console.log("✅ Database seeded successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
