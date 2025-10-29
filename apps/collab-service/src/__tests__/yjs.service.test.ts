import { YjsService } from '../services/yjs.service.js';
import * as Y from 'yjs';
import { jest } from '@jest/globals';

// Mock Redis client
jest.unstable_mockModule('redis', () => ({
    createClient: jest.fn(() => ({
        connect: jest.fn(),
        on: jest.fn(),
        subscribe: jest.fn(),
        publish: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        del: jest.fn(),
        quit: jest.fn(),
        disconnect: jest.fn(),
        isOpen: true,
        ping: jest.fn().mockResolvedValue('PONG'),
    })),
}));

// Mock Prisma
jest.unstable_mockModule('@prisma/client', () => ({
    PrismaClient: jest.fn(() => ({
        session: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        $disconnect: jest.fn(),
    })),
}));

// Mock SnapshotService
jest.unstable_mockModule('../services/snapshot.service.js', () => ({
    SnapshotService: {
        saveSnapshot: jest.fn(),
        loadSnapshot: jest.fn(),
        startPeriodicSnapshots: jest.fn(),
        stopPeriodicSnapshots: jest.fn(),
    },
}));

describe('YjsService', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    afterEach(async () => {
        // Cleanup - clear all documents
        await YjsService.clearAll();
    });

    describe('getDocument', () => {
        it('should create a new document if it does not exist', () => {
            const sessionId = 'test-session-1';

            const { doc } = YjsService.getDocument(sessionId);

            expect(doc).toBeInstanceOf(Y.Doc);
            expect(YjsService.hasDocument(sessionId)).toBe(true);
        });

        it('should return existing document if it already exists', () => {
            const sessionId = 'test-session-2';

            const { doc: doc1 } = YjsService.getDocument(sessionId);
            const { doc: doc2 } = YjsService.getDocument(sessionId);

            expect(doc1).toBe(doc2);
        });

        it('should create independent documents for different sessions', () => {
            const sessionId1 = 'test-session-3';
            const sessionId2 = 'test-session-4';

            const { doc: doc1 } = YjsService.getDocument(sessionId1);
            const { doc: doc2 } = YjsService.getDocument(sessionId2);

            expect(doc1).not.toBe(doc2);
            expect(YjsService.hasDocument(sessionId1)).toBe(true);
            expect(YjsService.hasDocument(sessionId2)).toBe(true);
        });
    });

    describe('addClient', () => {
        it('should add a client to a session', () => {
            const sessionId = 'test-session-5';
            const clientId = 'client-1';

            YjsService.getDocument(sessionId);
            YjsService.addClient(sessionId, clientId);

            const clientCount = YjsService.getClientCount(sessionId);
            expect(clientCount).toBe(1);
        });

        it('should handle multiple clients in a session', () => {
            const sessionId = 'test-session-6';
            const clientId1 = 'client-1';
            const clientId2 = 'client-2';

            YjsService.getDocument(sessionId);
            YjsService.addClient(sessionId, clientId1);
            YjsService.addClient(sessionId, clientId2);

            const clientCount = YjsService.getClientCount(sessionId);
            expect(clientCount).toBe(2);
        });
    });

    describe('removeClient', () => {
        it('should remove a client from a session', () => {
            const sessionId = 'test-session-7';
            const clientId = 'client-1';

            YjsService.getDocument(sessionId);
            YjsService.addClient(sessionId, clientId);

            expect(YjsService.getClientCount(sessionId)).toBe(1);

            YjsService.removeClient(sessionId, clientId);

            expect(YjsService.getClientCount(sessionId)).toBe(0);
        });

        it('should not throw error when removing non-existent client', () => {
            const sessionId = 'test-session-8';
            const clientId = 'non-existent-client';

            YjsService.getDocument(sessionId);

            expect(() => {
                YjsService.removeClient(sessionId, clientId);
            }).not.toThrow();
        });
    });

    describe('deleteDocument', () => {
        it('should delete a document and its clients', () => {
            const sessionId = 'test-session-9';
            const clientId = 'client-1';

            YjsService.getDocument(sessionId);
            YjsService.addClient(sessionId, clientId);

            expect(YjsService.hasDocument(sessionId)).toBe(true);

            YjsService.deleteDocument(sessionId);

            expect(YjsService.hasDocument(sessionId)).toBe(false);
        });
    });

    describe('getClientCount', () => {
        it('should return 0 for non-existent session', () => {
            const sessionId = 'non-existent-session';

            const clientCount = YjsService.getClientCount(sessionId);

            expect(clientCount).toBe(0);
        });

        it('should return correct client count', () => {
            const sessionId = 'test-session-10';
            const clientId1 = 'client-1';
            const clientId2 = 'client-2';

            YjsService.getDocument(sessionId);
            YjsService.addClient(sessionId, clientId1);
            YjsService.addClient(sessionId, clientId2);

            const clientCount = YjsService.getClientCount(sessionId);

            expect(clientCount).toBe(2);
        });
    });

    describe('hasDocument', () => {
        it('should return false for non-existent document', () => {
            const sessionId = 'non-existent-session';

            expect(YjsService.hasDocument(sessionId)).toBe(false);
        });

        it('should return true for existing document', () => {
            const sessionId = 'test-session-11';

            YjsService.getDocument(sessionId);

            expect(YjsService.hasDocument(sessionId)).toBe(true);
        });
    });

    describe('clearAll', () => {
        it('should clear all documents and clients', async () => {
            const sessionId1 = 'test-session-12';
            const sessionId2 = 'test-session-13';

            YjsService.getDocument(sessionId1);
            YjsService.getDocument(sessionId2);
            YjsService.addClient(sessionId1, 'client-1');
            YjsService.addClient(sessionId2, 'client-2');

            expect(YjsService.hasDocument(sessionId1)).toBe(true);
            expect(YjsService.hasDocument(sessionId2)).toBe(true);

            await YjsService.clearAll();

            expect(YjsService.hasDocument(sessionId1)).toBe(false);
            expect(YjsService.hasDocument(sessionId2)).toBe(false);
        });
    });

    describe('Document content synchronization', () => {
        it('should allow text operations on Yjs document', () => {
            const sessionId = 'test-session-14';

            const { doc } = YjsService.getDocument(sessionId);
            const text = doc.getText('code');

            text.insert(0, 'Hello, World!');

            expect(text.toString()).toBe('Hello, World!');
        });

        it('should maintain document state across multiple operations', () => {
            const sessionId = 'test-session-15';

            const { doc } = YjsService.getDocument(sessionId);
            const text = doc.getText('code');

            text.insert(0, 'Line 1\n');
            text.insert(7, 'Line 2\n');
            text.insert(14, 'Line 3');

            expect(text.toString()).toBe('Line 1\nLine 2\nLine 3');
        });

        it('should retrieve code content via getCode method', () => {
            const sessionId = 'test-session-16';

            const { doc } = YjsService.getDocument(sessionId);
            const text = doc.getText('code');

            text.insert(0, 'const x = 42;');

            const code = YjsService.getCode(sessionId);
            expect(code).toBe('const x = 42;');
        });
    });

    describe('Client count tracking', () => {
        it('should correctly track client count', () => {
            const sessionId = 'test-session-17';

            YjsService.getDocument(sessionId);

            expect(YjsService.getClientCount(sessionId)).toBe(0);

            YjsService.addClient(sessionId, 'client-1');
            expect(YjsService.getClientCount(sessionId)).toBe(1);

            YjsService.addClient(sessionId, 'client-2');
            expect(YjsService.getClientCount(sessionId)).toBe(2);

            YjsService.removeClient(sessionId, 'client-1');
            expect(YjsService.getClientCount(sessionId)).toBe(1);

            YjsService.removeClient(sessionId, 'client-2');
            expect(YjsService.getClientCount(sessionId)).toBe(0);
        });

        it('should not duplicate clients', () => {
            const sessionId = 'test-session-18';
            const clientId = 'client-1';

            YjsService.getDocument(sessionId);

            YjsService.addClient(sessionId, clientId);
            YjsService.addClient(sessionId, clientId);
            YjsService.addClient(sessionId, clientId);

            expect(YjsService.getClientCount(sessionId)).toBe(1);
        });
    });

    describe('getState', () => {
        it('should return null for non-existent document', () => {
            const sessionId = 'non-existent-session';

            const state = YjsService.getState(sessionId);

            expect(state).toBeNull();
        });

        it('should return state for existing document', () => {
            const sessionId = 'test-session-19';

            YjsService.getDocument(sessionId);
            const state = YjsService.getState(sessionId);

            expect(state).toBeInstanceOf(Uint8Array);
        });
    });

    describe('getStats', () => {
        it('should return correct statistics', () => {
            const sessionId1 = 'test-session-20';
            const sessionId2 = 'test-session-21';

            YjsService.getDocument(sessionId1);
            YjsService.getDocument(sessionId2);
            YjsService.addClient(sessionId1, 'client-1');
            YjsService.addClient(sessionId2, 'client-2');
            YjsService.addClient(sessionId2, 'client-3');

            const stats = YjsService.getStats();

            expect(stats.totalDocuments).toBe(2);
            expect(stats.totalClients).toBe(3);
            expect(stats.documents).toHaveLength(2);
        });
    });
});
