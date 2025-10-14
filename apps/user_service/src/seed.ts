import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.userRole.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});
  console.log("Cleared existing data.");

  // Seed Roles
  const adminRole = await prisma.role.create({ data: { name: "admin" } });
  const userRole = await prisma.role.create({ data: { name: "user" } });
  console.log("Seeded roles.");

  // Seed Permissions
  const permissions = [
    "users:read",
    "users:write",
    "questions:read",
    "questions:write",
    "admin:read",
    "admin:write",
  ];
  const createdPermissions = await Promise.all(
    permissions.map((p) => prisma.permission.create({ data: { name: p } })),
  );
  console.log("Seeded permissions.");

  // Assign Permissions to Roles
  // Admin gets all permissions
  await Promise.all(
    createdPermissions.map((p) =>
      prisma.rolePermission.create({
        data: { role_id: adminRole.id, permission_id: p.id },
      }),
    ),
  );

  // User gets basic read permissions
  const userPermissions = createdPermissions.filter((p) =>
    p.name.endsWith(":read"),
  );
  await Promise.all(
    userPermissions.map((p) =>
      prisma.rolePermission.create({
        data: { role_id: userRole.id, permission_id: p.id },
      }),
    ),
  );
  console.log("Assigned permissions to roles.");

  // Seed Users
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      username: "admin_user",
      display_name: "Admin User",
      programming_proficiency: "advanced",
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      email: "user@example.com",
      username: "normal_user",
      display_name: "Normal User",
      programming_proficiency: "beginner",
    },
  });

  // Connect users to roles
  await prisma.userRole.createMany({
    data: [
      { user_id: adminUser.id, role_id: adminRole.id },
      { user_id: normalUser.id, role_id: userRole.id },
    ],
  });

  console.log("Seeded users.");

  console.log("Database seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
