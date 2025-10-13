import { describe, it, expect } from '@jest/globals';
import supertest from 'supertest';
import { createServer } from '../server';

const app = createServer();

describe('GET /health', () => {
  it('should return 200 OK', async () => {
    const response = await supertest(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });
});
