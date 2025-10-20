import prisma from './prisma';
import logger from './logger';

async function main() {
  logger.info("Seeding database...");

  // Clear existing data
  await prisma.userRole.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.permission.deleteMany({});
  logger.info("Cleared existing data.");

  // Seed Roles
  const adminRole = await prisma.role.create({ data: { name: "admin" } });
  const userRole = await prisma.role.create({ data: { name: "user" } });
  logger.info("Seeded roles.");

  // Seed Permissions
  const permissions = [
    // User-level permissions
    'users:read:self', // A user's own permissions, often implied
    'users:read',      // Permission to read any user's data

    // Admin-level permissions for user management
    'admin:users:read',
    'admin:users:edit',
    'admin:users:delete',
    'admin:users:edit-roles',

    // Admin-level permissions for role management
    'admin:roles:create',
    'admin:roles:read',
    'admin:roles:edit-permissions',

    // Admin-level permissions for permission management
    'admin:permissions:create',
    'admin:permissions:read',
  ];
  const createdPermissions = await Promise.all(
    permissions.map((p) => prisma.permission.create({ data: { name: p } })),
  );
  logger.info("Seeded permissions.");

  // Assign Permissions to Roles
  // Admin gets all permissions
  await Promise.all(
    createdPermissions.map((p) =>
      prisma.rolePermission.create({
        data: { role_id: adminRole.id, permission_id: p.id },
      }),
    ),
  );

  // User gets basic self-service and read permissions
  const userPermissions = createdPermissions.filter(
    (p) => p.name === 'users:read:self' || p.name === 'users:read',
  );
  if (userPermissions.length > 0) {
    await Promise.all(
        userPermissions.map((p) =>
            prisma.rolePermission.create({
                data: { role_id: userRole.id, permission_id: p.id },
            }),
        ),
    );
  }
  logger.info("Assigned permissions to roles.");

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

  logger.info("Seeded users.");

  logger.info("Database seeding complete.");
}

main()
  .catch((e) => {
  logger.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
