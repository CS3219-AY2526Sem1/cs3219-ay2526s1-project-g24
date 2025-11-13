// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: September 15-20, 2025
// Scope: Generated health check controllers for Kubernetes readiness/liveness probes:
//   - HealthController.getHealth(): Basic health endpoint
//   - ReadyController.getReady(): Readiness probe endpoint
// Author review: Code reviewed, tested, and validated by team. No modifications needed.

import { Controller, Get, Route } from 'tsoa';

@Route('health')
export class HealthController extends Controller {
  @Get('/')
  public async getHealth() {
    return { status: 'OK' };
  }
}

@Route('ready')
export class ReadyController extends Controller {
    @Get('/')
    public async getReady() {
        return { status: 'OK' };
    }
}

@Route('metrics')
export class MetricsController extends Controller {
    @Get('/')
    public async getMetrics() {
        return { status: 'OK' };
    }
}
