import {
  INestApplication,
  Controller,
  Get,
  Param,
  Injectable,
  Module,
  DynamicModule,
} from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupTestData } from './app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';
import { MemoryStorageModule } from '@dismissible/nestjs-storage';
import { DismissibleService } from '../src/core/dismissible.service';
import { DismissibleCoreService } from '../src/core/dismissible-core.service';
import { DismissibleItemMapper } from '../src/api/dismissible-item.mapper';

/**
 * Custom provider: CounterService
 * A simple service that tracks call counts, demonstrating
 * custom providers passed via the `providers` option.
 */
@Injectable()
class CounterService {
  private count = 0;

  increment(): number {
    return ++this.count;
  }

  getCount(): number {
    return this.count;
  }
}

/**
 * Custom controller that injects:
 * - DismissibleService (exported from DismissibleModule)
 * - CounterService (provided via `providers` option)
 */
@Controller('custom')
class CustomController {
  constructor(
    private readonly dismissibleService: DismissibleService,
    private readonly counterService: CounterService,
  ) {}

  @Get(':userId/:itemId')
  async getWithCount(@Param('userId') userId: string, @Param('itemId') itemId: string) {
    const result = await this.dismissibleService.getOrCreate(itemId, userId);
    return {
      item: result.item,
      created: result.created,
      callCount: this.counterService.increment(),
    };
  }
}

/**
 * Custom service from an imported module
 */
@Injectable()
class MetricsService {
  private events: string[] = [];

  track(event: string): void {
    this.events.push(event);
  }

  getEvents(): string[] {
    return this.events;
  }
}

/**
 * Custom module to be passed via `imports` option.
 * Uses forRoot() to return a DynamicModule as required by DismissibleModule.
 */
@Module({})
class MetricsModule {
  static forRoot(): DynamicModule {
    return {
      module: MetricsModule,
      providers: [MetricsService],
      exports: [MetricsService],
    };
  }
}

/**
 * Custom controller that injects:
 * - DismissibleCoreService (exported from DismissibleModule)
 * - DismissibleItemMapper (exported from DismissibleModule)
 * - MetricsService (from imported MetricsModule)
 */
@Controller('metrics')
class MetricsController {
  constructor(
    private readonly coreService: DismissibleCoreService,
    private readonly mapper: DismissibleItemMapper,
    private readonly metricsService: MetricsService,
  ) {}

  @Get(':userId/:itemId')
  async getWithMetrics(@Param('userId') userId: string, @Param('itemId') itemId: string) {
    this.metricsService.track(`get:${userId}:${itemId}`);

    const result = await this.coreService.getOrCreate(itemId, userId);
    const responseDto = this.mapper.toResponseDto(result.item);

    return {
      data: responseDto,
      created: result.created,
      trackedEvents: this.metricsService.getEvents(),
    };
  }
}

describe('Custom controllers via DismissibleModule options', () => {
  describe('Custom controller with custom provider', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          logger: NullLogger,
          storage: MemoryStorageModule.forRoot(),
          controllers: [CustomController],
          providers: [CounterService],
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

    it('should inject DismissibleService into custom controller', async () => {
      const userId = 'custom-user-1';
      const itemId = 'custom-item-1';

      const response = await request(app.getHttpServer())
        .get(`/custom/${userId}/${itemId}`)
        .expect(200);

      expect(response.body.item).toBeDefined();
      expect(response.body.item.id).toBe(itemId);
      expect(response.body.item.userId).toBe(userId);
      expect(response.body.created).toBe(true);
    });

    it('should inject custom CounterService into custom controller', async () => {
      const userId = 'custom-user-2';
      const itemId = 'custom-item-2';

      const response1 = await request(app.getHttpServer())
        .get(`/custom/${userId}/${itemId}`)
        .expect(200);

      const firstCallCount = response1.body.callCount;
      expect(firstCallCount).toBeGreaterThan(0);

      const response2 = await request(app.getHttpServer())
        .get(`/custom/${userId}/${itemId}`)
        .expect(200);

      // CounterService increments on each call
      expect(response2.body.callCount).toBe(firstCallCount + 1);
    });

    it('should return existing item on subsequent calls', async () => {
      const userId = 'custom-user-3';
      const itemId = 'custom-item-3';

      const response1 = await request(app.getHttpServer())
        .get(`/custom/${userId}/${itemId}`)
        .expect(200);

      expect(response1.body.created).toBe(true);

      const response2 = await request(app.getHttpServer())
        .get(`/custom/${userId}/${itemId}`)
        .expect(200);

      expect(response2.body.created).toBe(false);
    });

    it('should not mount default controllers when custom controllers are provided', async () => {
      // Try to access a default route (e.g. standard getOrCreate)
      // Since we replaced controllers with [CustomController], this route should not exist
      await request(app.getHttpServer())
        .get('/v1/users/default-user/items/default-item')
        .expect(404);
    });
  });

  describe('Custom controller via imported module', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          logger: NullLogger,
          storage: MemoryStorageModule.forRoot(),
          imports: [MetricsModule.forRoot()],
          controllers: [MetricsController],
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

    it('should inject DismissibleCoreService into custom controller', async () => {
      const userId = 'metrics-user-1';
      const itemId = 'metrics-item-1';

      const response = await request(app.getHttpServer())
        .get(`/metrics/${userId}/${itemId}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.itemId).toBe(itemId);
      expect(response.body.data.userId).toBe(userId);
      expect(response.body.created).toBe(true);
    });

    it('should inject DismissibleItemMapper into custom controller', async () => {
      const userId = 'metrics-user-2';
      const itemId = 'metrics-item-2';

      const response = await request(app.getHttpServer())
        .get(`/metrics/${userId}/${itemId}`)
        .expect(200);

      // DismissibleItemMapper converts `id` to `itemId` and dates to ISO strings
      expect(response.body.data.itemId).toBe(itemId);
      expect(response.body.data.createdAt).toBeDefined();
      expect(typeof response.body.data.createdAt).toBe('string');
    });

    it('should inject MetricsService from imported module into custom controller', async () => {
      const userId = 'metrics-user-3';
      const itemId = 'metrics-item-3';

      const response1 = await request(app.getHttpServer())
        .get(`/metrics/${userId}/${itemId}`)
        .expect(200);

      expect(response1.body.trackedEvents).toBeDefined();
      expect(response1.body.trackedEvents).toContain(`get:${userId}:${itemId}`);
      const firstEventCount = response1.body.trackedEvents.length;

      // Make another call and verify events accumulate
      const response2 = await request(app.getHttpServer())
        .get(`/metrics/${userId}/${itemId}`)
        .expect(200);

      // MetricsService accumulates events across calls
      expect(response2.body.trackedEvents.length).toBe(firstEventCount + 1);
    });
  });
});
