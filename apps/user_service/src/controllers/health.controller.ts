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
