require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const PERMISSIONS = require("../src/constants/permissions");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Organization — find or create (no unique on name, so use findFirst)
  let organization = await prisma.organization.findFirst({
    where: { name: "ChefLab Demo" },
  });
  if (!organization) {
    organization = await prisma.organization.create({
      data: { name: "ChefLab Demo" },
    });
  }

  // Admin Role — upsert by compound unique (organizationId, nameEn)
  const adminRole = await prisma.role.upsert({
    where: {
      organizationId_nameEn: {
        organizationId: organization.id,
        nameEn: "Admin",
      },
    },
    update: {
      nameAr: "مدير النظام",
      permissions: {
        [PERMISSIONS.USERS_VIEW]: true,
        [PERMISSIONS.USERS_CREATE]: true,
        [PERMISSIONS.USERS_EDIT]: true,
        [PERMISSIONS.USERS_DELETE]: true,
        [PERMISSIONS.ROLES_VIEW]: true,
        [PERMISSIONS.ROLES_CREATE]: true,
        [PERMISSIONS.ROLES_EDIT]: true,
        [PERMISSIONS.ROLES_DELETE]: true,
        [PERMISSIONS.RECIPES_VIEW]: true,
        [PERMISSIONS.RECIPES_CREATE]: true,
        [PERMISSIONS.RECIPES_EDIT]: true,
        [PERMISSIONS.RECIPES_DELETE]: true,
        [PERMISSIONS.INGREDIENTS_VIEW]: true,
        [PERMISSIONS.INGREDIENTS_CREATE]: true,
        [PERMISSIONS.INGREDIENTS_EDIT]: true,
        [PERMISSIONS.INGREDIENTS_DELETE]: true,
        [PERMISSIONS.CATEGORIES_VIEW]: true,
        [PERMISSIONS.CATEGORIES_CREATE]: true,
        [PERMISSIONS.CATEGORIES_EDIT]: true,
        [PERMISSIONS.CATEGORIES_DELETE]: true,
      },
    },
    create: {
      organizationId: organization.id,
      nameAr: "مدير النظام",
      nameEn: "Admin",
      permissions: {
        [PERMISSIONS.USERS_VIEW]: true,
        [PERMISSIONS.USERS_CREATE]: true,
        [PERMISSIONS.USERS_EDIT]: true,
        [PERMISSIONS.USERS_DELETE]: true,
        [PERMISSIONS.ROLES_VIEW]: true,
        [PERMISSIONS.ROLES_CREATE]: true,
        [PERMISSIONS.ROLES_EDIT]: true,
        [PERMISSIONS.ROLES_DELETE]: true,
        [PERMISSIONS.RECIPES_VIEW]: true,
        [PERMISSIONS.RECIPES_CREATE]: true,
        [PERMISSIONS.RECIPES_EDIT]: true,
        [PERMISSIONS.RECIPES_DELETE]: true,
        [PERMISSIONS.INGREDIENTS_VIEW]: true,
        [PERMISSIONS.INGREDIENTS_CREATE]: true,
        [PERMISSIONS.INGREDIENTS_EDIT]: true,
        [PERMISSIONS.INGREDIENTS_DELETE]: true,
        [PERMISSIONS.CATEGORIES_VIEW]: true,
        [PERMISSIONS.CATEGORIES_CREATE]: true,
        [PERMISSIONS.CATEGORIES_EDIT]: true,
        [PERMISSIONS.CATEGORIES_DELETE]: true,
      },
    },
  });

  // Chef Role
  await prisma.role.upsert({
    where: {
      organizationId_nameEn: {
        organizationId: organization.id,
        nameEn: "Chef",
      },
    },
    update: { nameAr: "شيف" },
    create: {
      organizationId: organization.id,
      nameAr: "شيف",
      nameEn: "Chef",
      permissions: {},
    },
  });

  // Kitchen Staff Role
  await prisma.role.upsert({
    where: {
      organizationId_nameEn: {
        organizationId: organization.id,
        nameEn: "Kitchen Staff",
      },
    },
    update: { nameAr: "موظف مطبخ" },
    create: {
      organizationId: organization.id,
      nameAr: "موظف مطبخ",
      nameEn: "Kitchen Staff",
      permissions: {},
    },
  });

  // Admin User — upsert by compound unique (organizationId, email)
  const passwordHash = await bcrypt.hash("12345678@Om", 10);
  await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: "omar156.mh@gmail.com",
      },
    },
    update: {
      name: "System Admin",
      roleId: adminRole.id,
      passwordHash,
    },
    create: {
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
