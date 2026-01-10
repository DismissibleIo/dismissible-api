import { INestApplication, Injectable, Module, DynamicModule } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { createTestApp, cleanupTestData } from '../../src/app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';

/**
 * Test service provided by a custom module.
 * Tracks events to verify the module is properly integrated.
 */
@Injectable()
class TestMetricsService {
  private events: string[] = [];

  track(event: string): void {
    this.events.push(event);
  }

  getEvents(): string[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}

/**
 * Custom module to be passed via the `imports` option.
 */
@Module({})
class TestMetricsModule {
  static forRoot(): DynamicModule {
    return {
      module: TestMetricsModule,
      providers: [TestMetricsService],
      exports: [TestMetricsService],
      global: true,
    };
  }
}

describe('AppModule with custom imports option', () => {
  let app: INestApplication;
  let metricsService: TestMetricsService;

  beforeAll(async () => {
    app = await createTestApp({
      moduleOptions: {
        configPath: join(__dirname, '../config/default'),
        logger: NullLogger,
        imports: [TestMetricsModule.forRoot()],
      },
    });

    metricsService = app.get(TestMetricsService);
    await cleanupTestData(app);
  });

  afterAll(async () => {
    if (app) {
      await cleanupTestData(app);
      await app.close();
    }
  });

  beforeEach(() => {
    metricsService.clear();
  });

  it('should resolve services from imported modules', () => {
    expect(metricsService).toBeDefined();
    expect(metricsService).toBeInstanceOf(TestMetricsService);
  });

  it('should allow imported module services to function correctly', () => {
    metricsService.track('test-event-1');
    metricsService.track('test-event-2');

    const events = metricsService.getEvents();
    expect(events).toHaveLength(2);
    expect(events).toContain('test-event-1');
    expect(events).toContain('test-event-2');
  });

  it('should still handle dismissible operations with custom imports', async () => {
    const userId = 'import-test-user-1';
    const itemId = 'import-test-item-1';

    const response = await request(app.getHttpServer())
      .get(`/v1/users/${userId}/items/${itemId}`)
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.data.itemId).toBe(itemId);
    expect(response.body.data.userId).toBe(userId);
  });

  it('should handle full CRUD cycle with custom imports', async () => {
    const userId = 'import-test-user-2';
    const itemId = 'import-test-item-2';

    // Create
    const createResponse = await request(app.getHttpServer())
      .get(`/v1/users/${userId}/items/${itemId}`)
      .expect(200);

    expect(createResponse.body.data.dismissedAt).toBeUndefined();

    // Dismiss
    const dismissResponse = await request(app.getHttpServer())
      .delete(`/v1/users/${userId}/items/${itemId}`)
      .expect(200);

    expect(dismissResponse.body.data.dismissedAt).toBeDefined();

    // Restore
    const restoreResponse = await request(app.getHttpServer())
      .post(`/v1/users/${userId}/items/${itemId}`)
      .expect(201);

    expect(restoreResponse.body.data.dismissedAt).toBeUndefined();
  });
});

describe('AppModule with multiple custom imports', () => {
  let app: INestApplication;

  /**
   * Second test service from another custom module.
   */
  @Injectable()
  class TestAuditService {
    private logs: string[] = [];

    log(message: string): void {
      this.logs.push(message);
    }

    getLogs(): string[] {
      return [...this.logs];
    }
  }

  @Module({})
  class TestAuditModule {
    static forRoot(): DynamicModule {
      return {
        module: TestAuditModule,
        providers: [TestAuditService],
        exports: [TestAuditService],
        global: true,
      };
    }
  }

  beforeAll(async () => {
    app = await createTestApp({
      moduleOptions: {
        configPath: join(__dirname, '../config/default'),
        logger: NullLogger,
        imports: [TestMetricsModule.forRoot(), TestAuditModule.forRoot()],
      },
    });
    await cleanupTestData(app);
  });

  afterAll(async () => {
    if (app) {
      await cleanupTestData(app);
      await app.close();
    }
  });

  it('should resolve services from multiple imported modules', () => {
    const metricsService = app.get(TestMetricsService);
    const auditService = app.get(TestAuditService);

    expect(metricsService).toBeDefined();
    expect(auditService).toBeDefined();
  });

  it('should allow multiple imported services to function independently', () => {
    const metricsService = app.get(TestMetricsService);
    const auditService = app.get(TestAuditService);

    metricsService.track('metric-1');
    auditService.log('audit-1');

    expect(metricsService.getEvents()).toContain('metric-1');
    expect(auditService.getLogs()).toContain('audit-1');
  });

  it('should handle dismissible operations with multiple imports', async () => {
    const userId = 'multi-import-user';
    const itemId = 'multi-import-item';

    const response = await request(app.getHttpServer())
      .get(`/v1/users/${userId}/items/${itemId}`)
      .expect(200);

    expect(response.body.data.itemId).toBe(itemId);
  });
});
