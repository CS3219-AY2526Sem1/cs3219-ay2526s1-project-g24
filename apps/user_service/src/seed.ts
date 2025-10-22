import prisma from "./prisma";
import logger from "./logger";
import { userRbacConfig } from "./config";

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
  const availableRoles = userRbacConfig.roles;
  await Promise.all(
    availableRoles.map((role) => prisma.role.create({ data: { name: role } }))
  );
  logger.info("Seeded roles.");

  // Seed Permissions
  const availablePermissions = userRbacConfig.permissions;
  await Promise.all(
    availablePermissions.map((permission) =>
      prisma.permission.create({ data: { name: permission } })
    )
  );
  logger.info("Seeded permissions.");

  // // Seed Permissions
  // const permissions = [
  //   // User-level permissions
  //   'users:read:self', // A user's own permissions, often implied
  //   'users:read',      // Permission to read any user's data

  //   // Admin-level permissions for user management
  //   'admin:users:read',
  //   'admin:users:edit',
  //   'admin:users:delete',
  //   'admin:users:edit-roles',

  //   // Admin-level permissions for role management
  //   'admin:roles:create',
  //   'admin:roles:read',
  //   'admin:roles:edit-permissions',

  //   // Admin-level permissions for permission management
  //   'admin:permissions:create',
  //   'admin:permissions:read',
  // ];
  // const createdPermissions = await Promise.all(
  //   permissions.map((p) => prisma.permission.create({ data: { name: p } })),
  // );

  // // Assign Permissions to Roles
  // // Admin gets all permissions
  // await Promise.all(
  //   createdPermissions.map((p) =>
  //     prisma.rolePermission.create({
  //       data: { role_id: adminRole.id, permission_id: p.id },
  //     }),
  //   ),
  // );

  // // User gets basic self-service and read permissions
  // const userPermissions = createdPermissions.filter(
  //   (p) => p.name === 'users:read:self' || p.name === 'users:read',
  // );
  // if (userPermissions.length > 0) {
  //   await Promise.all(
  //       userPermissions.map((p) =>
  //           prisma.rolePermission.create({
  //               data: { role_id: userRole.id, permission_id: p.id },
  //           }),
  //       ),
  //   );
  // }

  // we want to get all keys from rbacConfig.rolesWithPermissions
  // the keys are the role names, the values are the permissions in array form
  // we will need to then find the role by name, then for each permission
  // in the array, find the permission by name, and create a rolePermission
  const roleEntries = Object.entries(userRbacConfig.rolesWithPermissions);
  for (const [roleName, permissions] of roleEntries) {
    logger.info(`Assigning permissions to role: ${roleName}`);
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;
    logger.info(`Found role: ${role.name}`);

    for (const permName of permissions) {
      logger.info(`Assigning permission: ${permName} to role: ${role.name}`);
      const permission = await prisma.permission.findUnique({
        where: { name: permName },
      });
      if (!permission) {
        logger.warn(`Permission not found: ${permName}`);
        continue;
      }

      await prisma.rolePermission.create({
        data: {
          role_id: role.id,
          permission_id: permission.id,
        },
      });
    }
  }

  logger.info("Assigned permissions to roles.");

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
