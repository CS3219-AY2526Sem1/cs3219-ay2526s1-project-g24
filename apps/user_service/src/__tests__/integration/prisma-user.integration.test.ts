
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';

let prisma: PrismaClient;
let dbContainer: StartedPostgreSqlContainer;

describe('Prisma User Integration (Testcontainers)', () => {
  let userId: string;

  beforeAll(async () => {
    dbContainer = await new PostgreSqlContainer('postgres:15-alpine').start();
    const databaseUrl = dbContainer.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;
    // Run migrations
    execSync('pnpm --filter user_service exec prisma migrate deploy');
    prisma = new PrismaClient();
    await prisma.user.deleteMany();
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    await dbContainer.stop();
  });

  it('should create, update, and delete a user', async () => {
    // Create
    const user = await prisma.user.create({
      data: {
        email: 'integration-test@example.com',
        display_name: 'Integration Test User',
      },
    });
    userId = user.id;
    expect(user.email).toBe('integration-test@example.com');
    expect(user.display_name).toBe('Integration Test User');

    // Update
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { display_name: 'Updated User' },
    });
    expect(updated.display_name).toBe('Updated User');

    // Delete
    const deleted = await prisma.user.delete({ where: { id: userId } });
    expect(deleted.id).toBe(userId);

    // Confirm deletion
    const shouldBeNull = await prisma.user.findUnique({ where: { id: userId } });
    expect(shouldBeNull).toBeNull();
  });
});
