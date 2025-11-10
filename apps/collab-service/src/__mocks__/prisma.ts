/**
 * Mock Prisma client for testing
 */

export const mockPrismaClient = {
    session: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
    },
    snapshot: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
    },
    $disconnect: jest.fn(),
    $connect: jest.fn(),
};

export const resetPrismaMocks = () => {
    Object.values(mockPrismaClient.session).forEach(fn => {
        if (typeof fn === 'function' && 'mockReset' in fn) {
            (fn as jest.Mock).mockReset();
        }
    });
    Object.values(mockPrismaClient.snapshot).forEach(fn => {
        if (typeof fn === 'function' && 'mockReset' in fn) {
            (fn as jest.Mock).mockReset();
        }
    });
};
