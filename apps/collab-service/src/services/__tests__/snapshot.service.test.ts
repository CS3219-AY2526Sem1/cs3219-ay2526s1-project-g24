/**
 * Unit tests for SnapshotService
 */

import { mockPrismaClient, resetPrismaMocks } from '../../__mocks__/prisma.js';
import { createMockSnapshot } from '../../__tests__/helpers/test-utils.js';

// Mock Prisma client
jest.mock('../../utils/prisma.js', () => ({
    prisma: mockPrismaClient,
}));

// Mock YjsService
jest.mock('../yjs.service.js', () => ({
    YjsService: {
        getStats: jest.fn(() => ({
            documents: [
                { sessionId: 'session_1', clients: 2 },
                { sessionId: 'session_2', clients: 1 },
            ],
        })),
        getState: jest.fn(() => new Uint8Array([1, 2, 3, 4, 5])),
        getDocument: jest.fn(),
        hasDocument: jest.fn(() => false),
    },
}));

import { SnapshotService } from '../snapshot.service.js';
import { YjsService } from '../yjs.service.js';

describe('SnapshotService', () => {
    beforeEach(() => {
        resetPrismaMocks();
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        SnapshotService.stopPeriodicSnapshots();
    });

    describe('startPeriodicSnapshots', () => {
        it('should start periodic snapshot job', () => {
            SnapshotService.startPeriodicSnapshots();

            // Should not start multiple times
            SnapshotService.startPeriodicSnapshots();

            expect(YjsService.getStats).toHaveBeenCalled();
        });

        it('should run snapshots periodically', async () => {
            const saveAllSpy = jest.spyOn(SnapshotService, 'saveAllActiveSnapshots');

            SnapshotService.startPeriodicSnapshots();

            // Fast-forward time
            jest.advanceTimersByTime(120000); // 2 minutes

            expect(saveAllSpy).toHaveBeenCalled();

            saveAllSpy.mockRestore();
        });
    });

    describe('stopPeriodicSnapshots', () => {
        it('should stop periodic snapshot job', () => {
            SnapshotService.startPeriodicSnapshots();
            SnapshotService.stopPeriodicSnapshots();

            // Stopping again should be safe
            SnapshotService.stopPeriodicSnapshots();
        });
    });

    describe('saveAllActiveSnapshots', () => {
        it('should save snapshots for all active sessions', async () => {
            (YjsService.getStats as jest.Mock).mockReturnValue({
                documents: [
                    { sessionId: 'session_1', clients: 2 },
                    { sessionId: 'session_2', clients: 1 },
                ],
            });

            const saveSpy = jest.spyOn(SnapshotService, 'saveSnapshot').mockResolvedValue();

            await SnapshotService.saveAllActiveSnapshots();

            expect(saveSpy).toHaveBeenCalledWith('session_1');
            expect(saveSpy).toHaveBeenCalledWith('session_2');

            saveSpy.mockRestore();
        });

        it('should not save snapshots when no active sessions', async () => {
            (YjsService.getStats as jest.Mock).mockReturnValue({
                documents: [],
            });

            const saveSpy = jest.spyOn(SnapshotService, 'saveSnapshot').mockResolvedValue();

            await SnapshotService.saveAllActiveSnapshots();

            expect(saveSpy).not.toHaveBeenCalled();

            saveSpy.mockRestore();
        });

        it('should skip sessions with no connected clients', async () => {
            (YjsService.getStats as jest.Mock).mockReturnValue({
                documents: [
                    { sessionId: 'session_1', clients: 0 },
                    { sessionId: 'session_2', clients: 1 },
                ],
            });

            const saveSpy = jest.spyOn(SnapshotService, 'saveSnapshot').mockResolvedValue();

            await SnapshotService.saveAllActiveSnapshots();

            expect(saveSpy).not.toHaveBeenCalledWith('session_1');
            expect(saveSpy).toHaveBeenCalledWith('session_2');

            saveSpy.mockRestore();
        });
    });

    describe('saveSnapshot', () => {
        it('should save snapshot successfully', async () => {
            const mockState = new Uint8Array([1, 2, 3, 4, 5]);
            (YjsService.getState as jest.Mock).mockReturnValue(mockState);

            mockPrismaClient.session.findUnique.mockResolvedValue({
                id: 'session-uuid',
            });

            mockPrismaClient.snapshot.findFirst.mockResolvedValue(null);
            mockPrismaClient.snapshot.create.mockResolvedValue(
                createMockSnapshot({ version: 1 })
            );

            const cleanupSpy = jest.spyOn(SnapshotService, 'cleanupOldSnapshots').mockResolvedValue();

            await SnapshotService.saveSnapshot('session_1');

            expect(mockPrismaClient.session.findUnique).toHaveBeenCalledWith({
                where: { sessionId: 'session_1' },
                select: { id: true },
            });

            expect(mockPrismaClient.snapshot.create).toHaveBeenCalledWith({
                data: {
                    sessionId: 'session-uuid',
                    yjsState: Buffer.from(mockState),
                    version: 1,
                },
            });

            expect(cleanupSpy).toHaveBeenCalledWith('session-uuid', 5);

            cleanupSpy.mockRestore();
        });

        it('should increment version number for subsequent snapshots', async () => {
            const mockState = new Uint8Array([1, 2, 3, 4, 5]);
            (YjsService.getState as jest.Mock).mockReturnValue(mockState);

            mockPrismaClient.session.findUnique.mockResolvedValue({
                id: 'session-uuid',
            });

            mockPrismaClient.snapshot.findFirst.mockResolvedValue({
                version: 3,
            });

            mockPrismaClient.snapshot.create.mockResolvedValue(
                createMockSnapshot({ version: 4 })
            );

            jest.spyOn(SnapshotService, 'cleanupOldSnapshots').mockResolvedValue();

            await SnapshotService.saveSnapshot('session_1');

            expect(mockPrismaClient.snapshot.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    version: 4,
                }),
            });
        });

        it('should skip if no state available', async () => {
            (YjsService.getState as jest.Mock).mockReturnValue(null);

            await SnapshotService.saveSnapshot('session_1');

            expect(mockPrismaClient.session.findUnique).not.toHaveBeenCalled();
        });

        it('should skip if session not found in database', async () => {
            const mockState = new Uint8Array([1, 2, 3, 4, 5]);
            (YjsService.getState as jest.Mock).mockReturnValue(mockState);

            mockPrismaClient.session.findUnique.mockResolvedValue(null);

            await SnapshotService.saveSnapshot('nonexistent');

            expect(mockPrismaClient.snapshot.create).not.toHaveBeenCalled();
        });
    });

    describe('loadLatestSnapshot', () => {
        it('should load latest snapshot successfully', async () => {
            const mockSnapshot = createMockSnapshot({
                yjsState: Buffer.from([1, 2, 3, 4, 5]),
                version: 3,
            });

            mockPrismaClient.session.findUnique.mockResolvedValue({
                id: 'session-uuid',
            });

            mockPrismaClient.snapshot.findFirst.mockResolvedValue(mockSnapshot);

            const result = await SnapshotService.loadLatestSnapshot('session_1');

            expect(mockPrismaClient.snapshot.findFirst).toHaveBeenCalledWith({
                where: { sessionId: 'session-uuid' },
                orderBy: { createdAt: 'desc' },
                select: { yjsState: true, version: true, createdAt: true },
            });

            expect(result).toBeInstanceOf(Uint8Array);
            expect(Array.from(result!)).toEqual([1, 2, 3, 4, 5]);
        });

        it('should return null if session not found', async () => {
            mockPrismaClient.session.findUnique.mockResolvedValue(null);

            const result = await SnapshotService.loadLatestSnapshot('nonexistent');

            expect(result).toBeNull();
        });

        it('should return null if no snapshots exist', async () => {
            mockPrismaClient.session.findUnique.mockResolvedValue({
                id: 'session-uuid',
            });

            mockPrismaClient.snapshot.findFirst.mockResolvedValue(null);

            const result = await SnapshotService.loadLatestSnapshot('session_1');

            expect(result).toBeNull();
        });

        it('should handle errors gracefully', async () => {
            mockPrismaClient.session.findUnique.mockRejectedValue(new Error('Database error'));

            const result = await SnapshotService.loadLatestSnapshot('session_1');

            expect(result).toBeNull();
        });
    });

    describe('cleanupOldSnapshots', () => {
        it('should delete old snapshots beyond keepCount', async () => {
            const mockSnapshots = [
                { id: 'snap-1' },
                { id: 'snap-2' },
                { id: 'snap-3' },
                { id: 'snap-4' },
                { id: 'snap-5' },
                { id: 'snap-6' }, // This one should be deleted
                { id: 'snap-7' }, // This one should be deleted
            ];

            mockPrismaClient.snapshot.findMany.mockResolvedValue(mockSnapshots);
            mockPrismaClient.snapshot.deleteMany.mockResolvedValue({ count: 2 });

            await SnapshotService.cleanupOldSnapshots('session-uuid', 5);

            expect(mockPrismaClient.snapshot.deleteMany).toHaveBeenCalledWith({
                where: { id: { in: ['snap-6', 'snap-7'] } },
            });
        });

        it('should not delete anything if within keepCount', async () => {
            const mockSnapshots = [
                { id: 'snap-1' },
                { id: 'snap-2' },
                { id: 'snap-3' },
            ];

            mockPrismaClient.snapshot.findMany.mockResolvedValue(mockSnapshots);

            await SnapshotService.cleanupOldSnapshots('session-uuid', 5);

            expect(mockPrismaClient.snapshot.deleteMany).not.toHaveBeenCalled();
        });
    });

    describe('getStats', () => {
        it('should return snapshot statistics', async () => {
            const now = new Date();
            const oldDate = new Date(Date.now() - 86400000);

            mockPrismaClient.snapshot.count.mockResolvedValue(100);
            mockPrismaClient.snapshot.groupBy.mockResolvedValue([
                { sessionId: 'session-1' },
                { sessionId: 'session-2' },
                { sessionId: 'session-3' },
            ]);
            mockPrismaClient.snapshot.findFirst
                .mockResolvedValueOnce({ createdAt: oldDate })
                .mockResolvedValueOnce({ createdAt: now });

            mockPrismaClient.snapshot.findMany.mockResolvedValue([
                { yjsState: Buffer.from([1, 2, 3]) },
                { yjsState: Buffer.from([4, 5, 6, 7]) },
            ]);

            const result = await SnapshotService.getStats();

            expect(result).toEqual({
                totalSnapshots: 100,
                snapshotsBySessions: 3,
                oldestSnapshot: oldDate,
                newestSnapshot: now,
                totalSize: 7,
            });
        });

        it('should handle empty database', async () => {
            mockPrismaClient.snapshot.count.mockResolvedValue(0);
            mockPrismaClient.snapshot.groupBy.mockResolvedValue([]);
            mockPrismaClient.snapshot.findFirst
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);
            mockPrismaClient.snapshot.findMany.mockResolvedValue([]);

            const result = await SnapshotService.getStats();

            expect(result).toEqual({
                totalSnapshots: 0,
                snapshotsBySessions: 0,
                oldestSnapshot: null,
                newestSnapshot: null,
                totalSize: 0,
            });
        });

        it('should handle errors gracefully', async () => {
            mockPrismaClient.snapshot.count.mockRejectedValue(new Error('Database error'));
            mockPrismaClient.snapshot.groupBy.mockRejectedValue(new Error('Database error'));
            mockPrismaClient.snapshot.findFirst.mockRejectedValue(new Error('Database error'));
            mockPrismaClient.snapshot.findMany.mockRejectedValue(new Error('Database error'));

            const result = await SnapshotService.getStats();

            expect(result).toEqual({
                totalSnapshots: 0,
                snapshotsBySessions: 0,
                oldestSnapshot: null,
                newestSnapshot: null,
                totalSize: 0,
            });
        });
    });

    describe('saveSnapshotManually', () => {
        it('should save snapshot manually and return true on success', async () => {
            const saveSpy = jest.spyOn(SnapshotService, 'saveSnapshot').mockResolvedValue();

            const result = await SnapshotService.saveSnapshotManually('session_1');

            expect(saveSpy).toHaveBeenCalledWith('session_1');
            expect(result).toBe(true);

            saveSpy.mockRestore();
        });

        it('should return false on error', async () => {
            const saveSpy = jest.spyOn(SnapshotService, 'saveSnapshot').mockRejectedValue(new Error('Save failed'));

            const result = await SnapshotService.saveSnapshotManually('session_1');

            expect(result).toBe(false);

            saveSpy.mockRestore();
        });
    });
});
