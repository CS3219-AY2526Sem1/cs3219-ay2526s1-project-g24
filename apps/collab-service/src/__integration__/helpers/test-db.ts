/**
 * Database helper for integration tests
 */

import { PrismaClient } from '@prisma/client';

export class TestDatabase {
    private static prisma: PrismaClient;

    static async setup(): Promise<PrismaClient> {
        if (!this.prisma) {
            this.prisma = new PrismaClient({
                datasources: {
                    db: {
                        url: process.env.DATABASE_URL,
                    },
                },
            });
            await this.prisma.$connect();
        }
        return this.prisma;
    }

    static async cleanup(): Promise<void> {
        if (this.prisma) {
            // Clean all test data in reverse order of foreign key dependencies
            await this.prisma.snapshot.deleteMany({});
            await this.prisma.session.deleteMany({});
        }
    }

    static async teardown(): Promise<void> {
        if (this.prisma) {
            await this.cleanup();
            await this.prisma.$disconnect();
        }
    }

    static getPrisma(): PrismaClient {
        if (!this.prisma) {
            throw new Error('Database not initialized. Call setup() first.');
        }
        return this.prisma;
    }

    /**
     * Create a test session in the database
     */
    static async createSession(data: {
        sessionId: string;
        user1Id: string;
        user2Id: string;
        questionId: string;
        difficulty?: string;
        topic?: string;
        language?: string;
        status?: 'ACTIVE' | 'TERMINATED' | 'EXPIRED';
    }) {
        return this.prisma.session.create({
            data: {
                sessionId: data.sessionId,
                user1Id: data.user1Id,
                user2Id: data.user2Id,
                questionId: data.questionId,
                difficulty: data.difficulty || 'Easy',
                topic: data.topic || 'Algorithms',
                language: data.language || 'python',
                status: data.status || 'ACTIVE',
                createdAt: new Date(),
            },
        });
    }

    /**
     * Create a test snapshot in the database
     */
    static async createSnapshot(data: {
        sessionId: string;
        yjsState: Buffer;
        version?: number;
    }) {
        // First get the session's internal ID
        const session = await this.prisma.session.findUnique({
            where: { sessionId: data.sessionId },
            select: { id: true },
        });

        if (!session) {
            throw new Error(`Session ${data.sessionId} not found`);
        }

        return this.prisma.snapshot.create({
            data: {
                sessionId: session.id,
                yjsState: data.yjsState,
                version: data.version || 1,
                createdAt: new Date(),
            },
        });
    }
}
