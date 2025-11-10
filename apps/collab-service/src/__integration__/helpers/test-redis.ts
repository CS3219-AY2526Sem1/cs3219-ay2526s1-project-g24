/**
 * Redis helper for integration tests
 */

import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

export class TestRedis {
  private static client: RedisClientType;
  private static pubClient: RedisClientType;
  private static subClient: RedisClientType;

  static async setup(): Promise<void> {
    const redisConfig = {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    };

    this.client = createClient(redisConfig);
    this.pubClient = createClient(redisConfig);
    this.subClient = createClient(redisConfig);

    await Promise.all([
      this.client.connect(),
      this.pubClient.connect(),
      this.subClient.connect(),
    ]);
  }

  static async cleanup(): Promise<void> {
    if (this.client && this.client.isOpen) {
      // Clear all test keys (be careful with pattern matching)
      const keys = await this.client.keys('session:*');
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    }
  }

  static async teardown(): Promise<void> {
    await this.cleanup();
    
    if (this.client?.isOpen) await this.client.quit();
    if (this.pubClient?.isOpen) await this.pubClient.quit();
    if (this.subClient?.isOpen) await this.subClient.quit();
  }

  static getClient(): RedisClientType {
    return this.client;
  }

  static getPubClient(): RedisClientType {
    return this.pubClient;
  }

  static getSubClient(): RedisClientType {
    return this.subClient;
  }
}
