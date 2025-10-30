import { describe, it, expect, beforeEach } from 'vitest';
import { HealthController, ReadyController, MetricsController } from '../health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('should return status OK', async () => {
    const result = await controller.getHealth();
    expect(result).toEqual({ status: 'OK' });
  });
});

describe('ReadyController', () => {
  let controller: ReadyController;

  beforeEach(() => {
    controller = new ReadyController();
  });

  it('should return status OK', async () => {
    const result = await controller.getReady();
    expect(result).toEqual({ status: 'OK' });
  });
});

describe('MetricsController', () => {
  let controller: MetricsController;

  beforeEach(() => {
    controller = new MetricsController();
  });

  it('should return status OK', async () => {
    const result = await controller.getMetrics();
    expect(result).toEqual({ status: 'OK' });
  });
});
