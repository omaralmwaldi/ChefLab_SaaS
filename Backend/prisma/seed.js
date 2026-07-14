require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const PERMISSIONS = require("../src/constants/permissions");

const prisma = new PrismaClient();

// Array of granted keys (new storage model). Absence = denied.
const ALL_PERMISSIONS = Object.values(PERMISSIONS);

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
  await prisma.role.upsert({
    where: {
      organizationId_nameEn: {
        organizationId: organization.id,
        nameEn: "Admin",
      },
    },
    update: {
      nameAr: "مدير النظام",
      permissions: ALL_PERMISSIONS,
    },
    create: {
      organizationId: organization.id,
      nameAr: "مدير النظام",
      nameEn: "Admin",
      permissions: ALL_PERMISSIONS,
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
      permissions: [],
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
      permissions: [],
    },
  });

  // Owner user — the organization creator. Holds no role; bypasses all RBAC.
  const passwordHash = await bcrypt.hash("12345678@Om", 10);
  const owner = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: "omar156.mh@gmail.com",
      },
    },
    update: {
      name: "System Admin",
      roleId: null,
      passwordHash,
    },
    create: {
      organizationId: organization.id,
      roleId: null,
      name: "System Admin",
      email: "omar156.mh@gmail.com",
      passwordHash,
    },
  });

  await prisma.organization.update({
    where: { id: organization.id },
    data: { ownerUserId: owner.id },
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
