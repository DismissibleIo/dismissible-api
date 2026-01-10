import { INestApplication, Injectable, BadRequestException } from '@nestjs/common';
import request from 'supertest';
import { join } from 'path';
import { createTestApp, cleanupTestData } from '../../src/app-test.factory';
import { NullLogger } from '@dismissible/nestjs-logger';
import { IDismissibleLifecycleHook, IHookResult } from '@dismissible/nestjs-core';
import { DismissibleItemDto } from '@dismissible/nestjs-item';
import { IRequestContext } from '@dismissible/nestjs-request';

/**
 * Shared tracking service for hook events.
 * Used to verify hooks are being called correctly.
 */
class HookTracker {
  private static events: string[] = [];

  static track(event: string): void {
    this.events.push(event);
  }

  static getEvents(): string[] {
    return [...this.events];
  }

  static clear(): void {
    this.events = [];
  }

  static hasEvent(event: string): boolean {
    return this.events.includes(event);
  }
}

/**
 * Audit hook that tracks all operations via onAfterRequest.
 */
@Injectable()
class AuditHook implements IDismissibleLifecycleHook {
  readonly priority = 100; // Run after other hooks

  async onAfterRequest(
    itemId: string,
    _item: DismissibleItemDto,
    userId: string,
    _context?: IRequestContext,
  ): Promise<void> {
    HookTracker.track(`audit:after:${itemId}:${userId}`);
  }

  async onBeforeRequest(
    itemId: string,
    userId: string,
    _context?: IRequestContext,
  ): Promise<IHookResult> {
    HookTracker.track(`audit:before:${itemId}:${userId}`);
    return { proceed: true };
  }
}

/**
 * Hook that tracks specific lifecycle events.
 */
@Injectable()
class LifecycleTrackingHook implements IDismissibleLifecycleHook {
  readonly priority = 50;

  async onBeforeCreate(
    itemId: string,
    userId: string,
    _context?: IRequestContext,
  ): Promise<IHookResult> {
    HookTracker.track(`lifecycle:beforeCreate:${itemId}:${userId}`);
    return { proceed: true };
  }

  async onAfterCreate(
    itemId: string,
    _item: DismissibleItemDto,
    userId: string,
    _context?: IRequestContext,
  ): Promise<void> {
    HookTracker.track(`lifecycle:afterCreate:${itemId}:${userId}`);
  }

  async onBeforeDismiss(
    itemId: string,
    userId: string,
    _context?: IRequestContext,
  ): Promise<IHookResult> {
    HookTracker.track(`lifecycle:beforeDismiss:${itemId}:${userId}`);
    return { proceed: true };
  }

  async onAfterDismiss(
    itemId: string,
    _item: DismissibleItemDto,
    userId: string,
    _context?: IRequestContext,
  ): Promise<void> {
    HookTracker.track(`lifecycle:afterDismiss:${itemId}:${userId}`);
  }

  async onBeforeRestore(
    itemId: string,
    userId: string,
    _context?: IRequestContext,
  ): Promise<IHookResult> {
    HookTracker.track(`lifecycle:beforeRestore:${itemId}:${userId}`);
    return { proceed: true };
  }

  async onAfterRestore(
    itemId: string,
    _item: DismissibleItemDto,
    userId: string,
    _context?: IRequestContext,
  ): Promise<void> {
    HookTracker.track(`lifecycle:afterRestore:${itemId}:${userId}`);
  }
}

/**
 * Hook that blocks operations based on item ID prefix.
 */
@Injectable()
class BlockingHook implements IDismissibleLifecycleHook {
  readonly priority = 10; // Run early to block before other hooks

  async onBeforeRequest(
    itemId: string,
    _userId: string,
    _context?: IRequestContext,
  ): Promise<IHookResult> {
    if (itemId.startsWith('blocked-')) {
      HookTracker.track(`blocking:blocked:${itemId}`);
      throw new BadRequestException('Item is blocked by hook');
    }
    return { proceed: true };
  }
}

/**
 * Hook with high priority to test execution order.
 */
@Injectable()
class HighPriorityHook implements IDismissibleLifecycleHook {
  readonly priority = 1; // Very high priority (lower number = higher priority)

  async onBeforeRequest(
    itemId: string,
    _userId: string,
    _context?: IRequestContext,
  ): Promise<IHookResult> {
    HookTracker.track(`priority:high:${itemId}`);
    return { proceed: true };
  }
}

/**
 * Hook with low priority to test execution order.
 */
@Injectable()
class LowPriorityHook implements IDismissibleLifecycleHook {
  readonly priority = 1000; // Low priority

  async onBeforeRequest(
    itemId: string,
    _userId: string,
    _context?: IRequestContext,
  ): Promise<IHookResult> {
    HookTracker.track(`priority:low:${itemId}`);
    return { proceed: true };
  }
}

describe('AppModule with custom hooks option', () => {
  describe('audit hook tracking', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/default'),
          logger: NullLogger,
          hooks: [AuditHook],
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

    beforeEach(() => {
      HookTracker.clear();
    });

    it('should call onBeforeRequest hook', async () => {
      const userId = 'hook-user-1';
      const itemId = 'hook-item-1';

      await request(app.getHttpServer()).get(`/v1/users/${userId}/items/${itemId}`).expect(200);

      expect(HookTracker.hasEvent(`audit:before:${itemId}:${userId}`)).toBe(true);
    });

    it('should call onAfterRequest hook', async () => {
      const userId = 'hook-user-2';
      const itemId = 'hook-item-2';

      await request(app.getHttpServer()).get(`/v1/users/${userId}/items/${itemId}`).expect(200);

      expect(HookTracker.hasEvent(`audit:after:${itemId}:${userId}`)).toBe(true);
    });

    it('should call hooks for dismiss operations', async () => {
      const userId = 'hook-user-3';
      const itemId = 'hook-item-3';

      // Create first
      await request(app.getHttpServer()).get(`/v1/users/${userId}/items/${itemId}`).expect(200);

      HookTracker.clear();

      // Dismiss
      await request(app.getHttpServer()).delete(`/v1/users/${userId}/items/${itemId}`).expect(200);

      expect(HookTracker.hasEvent(`audit:before:${itemId}:${userId}`)).toBe(true);
      expect(HookTracker.hasEvent(`audit:after:${itemId}:${userId}`)).toBe(true);
    });

    it('should call hooks for restore operations', async () => {
      const userId = 'hook-user-4';
      const itemId = 'hook-item-4';

      // Create and dismiss first
      await request(app.getHttpServer()).get(`/v1/users/${userId}/items/${itemId}`).expect(200);

      await request(app.getHttpServer()).delete(`/v1/users/${userId}/items/${itemId}`).expect(200);

      HookTracker.clear();

      // Restore
      await request(app.getHttpServer()).post(`/v1/users/${userId}/items/${itemId}`).expect(201);

      expect(HookTracker.hasEvent(`audit:before:${itemId}:${userId}`)).toBe(true);
      expect(HookTracker.hasEvent(`audit:after:${itemId}:${userId}`)).toBe(true);
    });
  });

  describe('lifecycle-specific hooks', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/default'),
          logger: NullLogger,
          hooks: [LifecycleTrackingHook],
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

    beforeEach(() => {
      HookTracker.clear();
    });

    it('should call onBeforeCreate and onAfterCreate for new items', async () => {
      const userId = 'lifecycle-user-1';
      const itemId = 'lifecycle-item-1';

      await request(app.getHttpServer()).get(`/v1/users/${userId}/items/${itemId}`).expect(200);

      expect(HookTracker.hasEvent(`lifecycle:beforeCreate:${itemId}:${userId}`)).toBe(true);
      expect(HookTracker.hasEvent(`lifecycle:afterCreate:${itemId}:${userId}`)).toBe(true);
    });

    it('should call onBeforeDismiss and onAfterDismiss', async () => {
      const userId = 'lifecycle-user-2';
      const itemId = 'lifecycle-item-2';

      // Create first
      await request(app.getHttpServer()).get(`/v1/users/${userId}/items/${itemId}`).expect(200);

      HookTracker.clear();

      // Dismiss
      await request(app.getHttpServer()).delete(`/v1/users/${userId}/items/${itemId}`).expect(200);

      expect(HookTracker.hasEvent(`lifecycle:beforeDismiss:${itemId}:${userId}`)).toBe(true);
      expect(HookTracker.hasEvent(`lifecycle:afterDismiss:${itemId}:${userId}`)).toBe(true);
    });

    it('should call onBeforeRestore and onAfterRestore', async () => {
      const userId = 'lifecycle-user-3';
      const itemId = 'lifecycle-item-3';

      // Create and dismiss first
      await request(app.getHttpServer()).get(`/v1/users/${userId}/items/${itemId}`).expect(200);

      await request(app.getHttpServer()).delete(`/v1/users/${userId}/items/${itemId}`).expect(200);

      HookTracker.clear();

      // Restore
      await request(app.getHttpServer()).post(`/v1/users/${userId}/items/${itemId}`).expect(201);

      expect(HookTracker.hasEvent(`lifecycle:beforeRestore:${itemId}:${userId}`)).toBe(true);
      expect(HookTracker.hasEvent(`lifecycle:afterRestore:${itemId}:${userId}`)).toBe(true);
    });
  });

  describe('blocking hook', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/default'),
          logger: NullLogger,
          hooks: [BlockingHook, AuditHook],
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

    beforeEach(() => {
      HookTracker.clear();
    });

    it('should block operations for items with blocked- prefix', async () => {
      const userId = 'block-user';
      const itemId = 'blocked-item';

      const response = await request(app.getHttpServer())
        .get(`/v1/users/${userId}/items/${itemId}`)
        .expect(400);

      expect(response.body.error.message).toContain('blocked by hook');
      expect(HookTracker.hasEvent(`blocking:blocked:${itemId}`)).toBe(true);
    });

    it('should allow operations for non-blocked items', async () => {
      const userId = 'block-user';
      const itemId = 'allowed-item';

      await request(app.getHttpServer()).get(`/v1/users/${userId}/items/${itemId}`).expect(200);

      expect(HookTracker.hasEvent(`audit:before:${itemId}:${userId}`)).toBe(true);
    });
  });

  describe('hook priority order', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/default'),
          logger: NullLogger,
          hooks: [LowPriorityHook, HighPriorityHook],
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

    beforeEach(() => {
      HookTracker.clear();
    });

    it('should execute hooks in priority order (lower number first)', async () => {
      const userId = 'priority-user';
      const itemId = 'priority-item';

      await request(app.getHttpServer()).get(`/v1/users/${userId}/items/${itemId}`).expect(200);

      const events = HookTracker.getEvents();
      const highIndex = events.findIndex((e) => e.includes('priority:high'));
      const lowIndex = events.findIndex((e) => e.includes('priority:low'));

      expect(highIndex).toBeLessThan(lowIndex);
    });
  });

  describe('multiple hooks together', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createTestApp({
        moduleOptions: {
          configPath: join(__dirname, '../config/default'),
          logger: NullLogger,
          hooks: [AuditHook, LifecycleTrackingHook, HighPriorityHook],
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

    beforeEach(() => {
      HookTracker.clear();
    });

    it('should execute all registered hooks', async () => {
      const userId = 'multi-hook-user';
      const itemId = 'multi-hook-item';

      await request(app.getHttpServer()).get(`/v1/users/${userId}/items/${itemId}`).expect(200);

      const events = HookTracker.getEvents();

      // All hooks should have been called
      expect(events.some((e) => e.includes('audit:'))).toBe(true);
      expect(events.some((e) => e.includes('lifecycle:'))).toBe(true);
      expect(events.some((e) => e.includes('priority:high'))).toBe(true);
    });
  });
});
