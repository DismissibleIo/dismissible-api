import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { DismissibleModule, IDismissibleModuleOptions } from './dismissible.module';
import { DismissibleService } from './core/dismissible.service';
import { IDismissibleLifecycleHook, IHookResult } from '@dismissible/nestjs-hooks';
import { DismissibleItemDto } from '@dismissible/nestjs-item';
import { IRequestContext } from '@dismissible/nestjs-request';
import {
  MemoryStorageAdapter,
  MemoryStorageModule,
  DISMISSIBLE_STORAGE_ADAPTER,
} from '@dismissible/nestjs-storage';
import { createTestContext } from './testing/factories';
import { NullLogger } from '@dismissible/nestjs-logger';

/**
 * Test hook that tracks all lifecycle method invocations.
 * Each method pushes its name to the `calls` array when invoked.
 */
@Injectable()
class TestLifecycleHook implements IDismissibleLifecycleHook {
  readonly priority = 0;

  /** Track all hook method calls in order */
  static calls: string[] = [];

  /** Track the arguments passed to each hook */
  static callArgs: Map<string, unknown[]> = new Map();

  /** Control whether hooks should block (proceed: false) */
  static shouldBlock: Map<string, boolean> = new Map();

  /** Custom reason for blocking */
  static blockReason = 'Blocked by test hook';

  static reset(): void {
    TestLifecycleHook.calls = [];
    TestLifecycleHook.callArgs = new Map();
    TestLifecycleHook.shouldBlock = new Map();
    TestLifecycleHook.blockReason = 'Blocked by test hook';
  }

  private recordCall(method: string, args: unknown[]): IHookResult {
    TestLifecycleHook.calls.push(method);
    TestLifecycleHook.callArgs.set(method, args);

    const shouldBlock = TestLifecycleHook.shouldBlock.get(method) ?? false;
    return {
      proceed: !shouldBlock,
      reason: shouldBlock ? TestLifecycleHook.blockReason : undefined,
    };
  }

  private recordPostCall(method: string, args: unknown[]): void {
    TestLifecycleHook.calls.push(method);
    TestLifecycleHook.callArgs.set(method, args);
  }

  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    return this.recordCall('onBeforeRequest', [itemId, userId, context]);
  }

  async onAfterRequest(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    this.recordPostCall('onAfterRequest', [itemId, item, userId, context]);
  }

  async onBeforeGet(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    return this.recordCall('onBeforeGet', [itemId, item, userId, context]);
  }

  async onAfterGet(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    this.recordPostCall('onAfterGet', [itemId, item, userId, context]);
  }

  async onBeforeCreate(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    return this.recordCall('onBeforeCreate', [itemId, userId, context]);
  }

  async onAfterCreate(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    this.recordPostCall('onAfterCreate', [itemId, item, userId, context]);
  }

  async onBeforeDismiss(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    return this.recordCall('onBeforeDismiss', [itemId, userId, context]);
  }

  async onAfterDismiss(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    this.recordPostCall('onAfterDismiss', [itemId, item, userId, context]);
  }

  async onBeforeRestore(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    return this.recordCall('onBeforeRestore', [itemId, userId, context]);
  }

  async onAfterRestore(
    itemId: string,
    item: DismissibleItemDto,
    userId: string,
    context?: IRequestContext,
  ): Promise<void> {
    this.recordPostCall('onAfterRestore', [itemId, item, userId, context]);
  }
}

describe('DismissibleModule Integration - Hook Lifecycle', () => {
  let module: TestingModule;
  let service: DismissibleService;
  let storage: MemoryStorageAdapter;

  const testUserId = 'test-user-123';
  const testItemId = 'test-item-456';

  beforeAll(async () => {
    const moduleOptions: IDismissibleModuleOptions = {
      storage: MemoryStorageModule.forRoot(),
      logger: NullLogger,
      hooks: [TestLifecycleHook],
    };

    module = await Test.createTestingModule({
      imports: [DismissibleModule.forRoot(moduleOptions)],
    }).compile();

    service = module.get<DismissibleService>(DismissibleService);
    storage = module.get<MemoryStorageAdapter>(DISMISSIBLE_STORAGE_ADAPTER);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    TestLifecycleHook.reset();
    await storage.deleteAll();
  });

  describe('getOrCreate - Create Flow', () => {
    it('should invoke hooks in correct order when creating a new item', async () => {
      const context = createTestContext();

      await service.getOrCreate(testItemId, testUserId, context);

      expect(TestLifecycleHook.calls).toEqual([
        'onBeforeRequest',
        'onBeforeCreate',
        'onAfterCreate',
        'onAfterRequest',
      ]);
    });

    it('should pass correct arguments to onBeforeRequest', async () => {
      const context = createTestContext();

      await service.getOrCreate(testItemId, testUserId, context);

      const args = TestLifecycleHook.callArgs.get('onBeforeRequest');
      expect(args).toBeDefined();
      expect(args![0]).toBe(testItemId);
      expect(args![1]).toBe(testUserId);
      expect(args![2]).toEqual(context);
    });

    it('should pass correct arguments to onBeforeCreate', async () => {
      const context = createTestContext();

      await service.getOrCreate(testItemId, testUserId, context);

      const args = TestLifecycleHook.callArgs.get('onBeforeCreate');
      expect(args).toBeDefined();
      expect(args![0]).toBe(testItemId);
      expect(args![1]).toBe(testUserId);
      expect(args![2]).toEqual(context);
    });

    it('should pass correct arguments to onAfterCreate', async () => {
      const context = createTestContext();

      await service.getOrCreate(testItemId, testUserId, context);

      const args = TestLifecycleHook.callArgs.get('onAfterCreate');
      expect(args).toBeDefined();
      expect(args![0]).toBe(testItemId);
      expect(args![1]).toMatchObject({
        id: testItemId,
        userId: testUserId,
      });
      expect(args![2]).toBe(testUserId);
      expect(args![3]).toEqual(context);
    });

    it('should pass correct arguments to onAfterRequest on create', async () => {
      const context = createTestContext();

      await service.getOrCreate(testItemId, testUserId, context);

      const args = TestLifecycleHook.callArgs.get('onAfterRequest');
      expect(args).toBeDefined();
      expect(args![0]).toBe(testItemId);
      expect(args![1]).toMatchObject({
        id: testItemId,
        userId: testUserId,
      });
      expect(args![2]).toBe(testUserId);
      expect(args![3]).toEqual(context);
    });

    it('should block operation when onBeforeRequest returns proceed: false', async () => {
      TestLifecycleHook.shouldBlock.set('onBeforeRequest', true);
      TestLifecycleHook.blockReason = 'Authentication failed';

      await expect(service.getOrCreate(testItemId, testUserId)).rejects.toThrow(ForbiddenException);

      expect(TestLifecycleHook.calls).toEqual(['onBeforeRequest']);
    });

    it('should block operation when onBeforeCreate returns proceed: false', async () => {
      TestLifecycleHook.shouldBlock.set('onBeforeCreate', true);
      TestLifecycleHook.blockReason = 'Quota exceeded';

      await expect(service.getOrCreate(testItemId, testUserId)).rejects.toThrow(ForbiddenException);

      expect(TestLifecycleHook.calls).toEqual(['onBeforeRequest', 'onBeforeCreate']);
    });
  });

  describe('getOrCreate - Get Flow', () => {
    beforeEach(async () => {
      await service.getOrCreate(testItemId, testUserId);
      TestLifecycleHook.reset();
    });

    it('should invoke hooks in correct order when getting an existing item', async () => {
      const context = createTestContext();

      await service.getOrCreate(testItemId, testUserId, context);

      expect(TestLifecycleHook.calls).toEqual([
        'onBeforeRequest',
        'onBeforeGet',
        'onAfterGet',
        'onAfterRequest',
      ]);
    });

    it('should pass correct arguments to onBeforeGet', async () => {
      const context = createTestContext();

      await service.getOrCreate(testItemId, testUserId, context);

      const args = TestLifecycleHook.callArgs.get('onBeforeGet');
      expect(args).toBeDefined();
      expect(args![0]).toBe(testItemId);
      expect(args![1]).toMatchObject({
        id: testItemId,
        userId: testUserId,
      });
      expect(args![2]).toBe(testUserId);
      expect(args![3]).toEqual(context);
    });

    it('should pass correct arguments to onAfterGet', async () => {
      const context = createTestContext();

      await service.getOrCreate(testItemId, testUserId, context);

      const args = TestLifecycleHook.callArgs.get('onAfterGet');
      expect(args).toBeDefined();
      expect(args![0]).toBe(testItemId);
      expect(args![1]).toMatchObject({
        id: testItemId,
        userId: testUserId,
      });
      expect(args![2]).toBe(testUserId);
      expect(args![3]).toEqual(context);
    });

    it('should block operation when onBeforeGet returns proceed: false', async () => {
      TestLifecycleHook.shouldBlock.set('onBeforeGet', true);
      TestLifecycleHook.blockReason = 'Item access denied';

      await expect(service.getOrCreate(testItemId, testUserId)).rejects.toThrow(ForbiddenException);

      expect(TestLifecycleHook.calls).toEqual(['onBeforeRequest', 'onBeforeGet']);
    });
  });

  describe('dismiss', () => {
    beforeEach(async () => {
      await service.getOrCreate(testItemId, testUserId);
      TestLifecycleHook.reset();
    });

    it('should invoke hooks in correct order when dismissing an item', async () => {
      const context = createTestContext();

      await service.dismiss(testItemId, testUserId, context);

      expect(TestLifecycleHook.calls).toEqual([
        'onBeforeRequest',
        'onBeforeDismiss',
        'onAfterDismiss',
        'onAfterRequest',
      ]);
    });

    it('should pass correct arguments to onBeforeDismiss', async () => {
      const context = createTestContext();

      await service.dismiss(testItemId, testUserId, context);

      const args = TestLifecycleHook.callArgs.get('onBeforeDismiss');
      expect(args).toBeDefined();
      expect(args![0]).toBe(testItemId);
      expect(args![1]).toBe(testUserId);
      expect(args![2]).toEqual(context);
    });

    it('should pass correct arguments to onAfterDismiss', async () => {
      const context = createTestContext();

      await service.dismiss(testItemId, testUserId, context);

      const args = TestLifecycleHook.callArgs.get('onAfterDismiss');
      expect(args).toBeDefined();
      expect(args![0]).toBe(testItemId);
      expect(args![1]).toMatchObject({
        id: testItemId,
        userId: testUserId,
        dismissedAt: expect.any(Date),
      });
      expect(args![2]).toBe(testUserId);
      expect(args![3]).toEqual(context);
    });

    it('should block operation when onBeforeDismiss returns proceed: false', async () => {
      TestLifecycleHook.shouldBlock.set('onBeforeDismiss', true);
      TestLifecycleHook.blockReason = 'Cannot dismiss protected item';

      await expect(service.dismiss(testItemId, testUserId)).rejects.toThrow(ForbiddenException);

      expect(TestLifecycleHook.calls).toEqual(['onBeforeRequest', 'onBeforeDismiss']);
    });

    it('should not run dismiss hooks when onBeforeRequest blocks', async () => {
      TestLifecycleHook.shouldBlock.set('onBeforeRequest', true);

      await expect(service.dismiss(testItemId, testUserId)).rejects.toThrow(ForbiddenException);

      expect(TestLifecycleHook.calls).toEqual(['onBeforeRequest']);
      expect(TestLifecycleHook.calls).not.toContain('onBeforeDismiss');
    });
  });

  describe('restore', () => {
    beforeEach(async () => {
      await service.getOrCreate(testItemId, testUserId);
      await service.dismiss(testItemId, testUserId);
      TestLifecycleHook.reset();
    });

    it('should invoke hooks in correct order when restoring an item', async () => {
      const context = createTestContext();

      await service.restore(testItemId, testUserId, context);

      expect(TestLifecycleHook.calls).toEqual([
        'onBeforeRequest',
        'onBeforeRestore',
        'onAfterRestore',
        'onAfterRequest',
      ]);
    });

    it('should pass correct arguments to onBeforeRestore', async () => {
      const context = createTestContext();

      await service.restore(testItemId, testUserId, context);

      const args = TestLifecycleHook.callArgs.get('onBeforeRestore');
      expect(args).toBeDefined();
      expect(args![0]).toBe(testItemId);
      expect(args![1]).toBe(testUserId);
      expect(args![2]).toEqual(context);
    });

    it('should pass correct arguments to onAfterRestore', async () => {
      const context = createTestContext();

      await service.restore(testItemId, testUserId, context);

      const args = TestLifecycleHook.callArgs.get('onAfterRestore');
      expect(args).toBeDefined();
      expect(args![0]).toBe(testItemId);
      expect(args![1]).toMatchObject({
        id: testItemId,
        userId: testUserId,
      });
      expect((args![1] as DismissibleItemDto).dismissedAt).toBeUndefined();
      expect(args![2]).toBe(testUserId);
      expect(args![3]).toEqual(context);
    });

    it('should block operation when onBeforeRestore returns proceed: false', async () => {
      TestLifecycleHook.shouldBlock.set('onBeforeRestore', true);
      TestLifecycleHook.blockReason = 'Cannot restore archived item';

      await expect(service.restore(testItemId, testUserId)).rejects.toThrow(ForbiddenException);

      expect(TestLifecycleHook.calls).toEqual(['onBeforeRequest', 'onBeforeRestore']);
    });

    it('should not run restore hooks when onBeforeRequest blocks', async () => {
      TestLifecycleHook.shouldBlock.set('onBeforeRequest', true);

      await expect(service.restore(testItemId, testUserId)).rejects.toThrow(ForbiddenException);

      expect(TestLifecycleHook.calls).toEqual(['onBeforeRequest']);
      expect(TestLifecycleHook.calls).not.toContain('onBeforeRestore');
    });
  });

  describe('full lifecycle flow', () => {
    it('should invoke all hook types through create -> dismiss -> restore cycle', async () => {
      const context = createTestContext();
      const allCalls: string[] = [];

      await service.getOrCreate(testItemId, testUserId, context);
      allCalls.push(...TestLifecycleHook.calls);
      TestLifecycleHook.reset();

      await service.getOrCreate(testItemId, testUserId, context);
      allCalls.push(...TestLifecycleHook.calls);
      TestLifecycleHook.reset();

      await service.dismiss(testItemId, testUserId, context);
      allCalls.push(...TestLifecycleHook.calls);
      TestLifecycleHook.reset();

      await service.restore(testItemId, testUserId, context);
      allCalls.push(...TestLifecycleHook.calls);

      expect(allCalls).toContain('onBeforeRequest');
      expect(allCalls).toContain('onAfterRequest');
      expect(allCalls).toContain('onBeforeCreate');
      expect(allCalls).toContain('onAfterCreate');
      expect(allCalls).toContain('onBeforeGet');
      expect(allCalls).toContain('onAfterGet');
      expect(allCalls).toContain('onBeforeDismiss');
      expect(allCalls).toContain('onAfterDismiss');
      expect(allCalls).toContain('onBeforeRestore');
      expect(allCalls).toContain('onAfterRestore');
    });
  });

  describe('context handling', () => {
    it('should pass undefined context through hooks when not provided', async () => {
      await service.getOrCreate(testItemId, testUserId);

      const args = TestLifecycleHook.callArgs.get('onBeforeRequest');
      expect(args![2]).toBeUndefined();
    });

    it('should preserve context through the entire hook chain', async () => {
      const context: IRequestContext = {
        requestId: 'unique-request-id',
        headers: { authorization: 'Bearer test-token' },
        query: {},
        params: {},
        body: {},
        user: {},
        ip: '127.0.0.1',
        method: 'GET',
        url: '/test',
        protocol: 'http',
        secure: false,
        hostname: 'localhost',
        port: 3000,
        path: '/test',
        search: '',
        searchParams: {},
        origin: 'http://localhost:3000',
        referer: '',
        userAgent: 'test-agent',
      };

      await service.getOrCreate(testItemId, testUserId, context);

      const beforeRequestArgs = TestLifecycleHook.callArgs.get('onBeforeRequest');
      const beforeCreateArgs = TestLifecycleHook.callArgs.get('onBeforeCreate');
      const afterCreateArgs = TestLifecycleHook.callArgs.get('onAfterCreate');
      const afterRequestArgs = TestLifecycleHook.callArgs.get('onAfterRequest');

      expect(beforeRequestArgs![2]).toEqual(context);
      expect(beforeCreateArgs![2]).toEqual(context);
      expect(afterCreateArgs![3]).toEqual(context);
      expect(afterRequestArgs![3]).toEqual(context);
    });

    it('should pass context to all hooks', async () => {
      const context = createTestContext();

      await service.getOrCreate(testItemId, testUserId);
      TestLifecycleHook.reset();

      await service.getOrCreate(testItemId, testUserId, context);

      const beforeRequestArgs = TestLifecycleHook.callArgs.get('onBeforeRequest');
      expect(beforeRequestArgs![2]).toEqual(context);

      const beforeGetArgs = TestLifecycleHook.callArgs.get('onBeforeGet');
      expect(beforeGetArgs![3]).toEqual(context);

      const afterGetArgs = TestLifecycleHook.callArgs.get('onAfterGet');
      expect(afterGetArgs![3]).toEqual(context);

      const afterRequestArgs = TestLifecycleHook.callArgs.get('onAfterRequest');
      expect(afterRequestArgs![3]).toEqual(context);
    });
  });
});

describe('DismissibleModule Integration - Multiple Hooks', () => {
  let module: TestingModule;
  let service: DismissibleService;
  let storage: MemoryStorageAdapter;

  const testUserId = 'test-user-123';
  const testItemId = 'test-item-456';

  const executionOrder: string[] = [];

  @Injectable()
  class FirstHook implements IDismissibleLifecycleHook {
    readonly priority = 1;

    async onBeforeRequest(): Promise<IHookResult> {
      executionOrder.push('FirstHook:onBeforeRequest');
      return { proceed: true };
    }

    async onAfterRequest(): Promise<void> {
      executionOrder.push('FirstHook:onAfterRequest');
    }
  }

  @Injectable()
  class SecondHook implements IDismissibleLifecycleHook {
    readonly priority = 2;

    async onBeforeRequest(): Promise<IHookResult> {
      executionOrder.push('SecondHook:onBeforeRequest');
      return { proceed: true };
    }

    async onAfterRequest(): Promise<void> {
      executionOrder.push('SecondHook:onAfterRequest');
    }
  }

  @Injectable()
  class ThirdHook implements IDismissibleLifecycleHook {
    readonly priority = 3;

    async onBeforeRequest(): Promise<IHookResult> {
      executionOrder.push('ThirdHook:onBeforeRequest');
      return { proceed: true };
    }

    async onAfterRequest(): Promise<void> {
      executionOrder.push('ThirdHook:onAfterRequest');
    }
  }

  beforeAll(async () => {
    const moduleOptions: IDismissibleModuleOptions = {
      storage: MemoryStorageModule.forRoot(),
      hooks: [ThirdHook, FirstHook, SecondHook], // Intentionally out of order
    };

    module = await Test.createTestingModule({
      imports: [DismissibleModule.forRoot(moduleOptions)],
    }).compile();

    service = module.get<DismissibleService>(DismissibleService);
    storage = module.get<MemoryStorageAdapter>(DISMISSIBLE_STORAGE_ADAPTER);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    executionOrder.length = 0;
    await storage.deleteAll();
  });

  it('should execute pre-hooks in priority order (low to high)', async () => {
    await service.getOrCreate(testItemId, testUserId);

    const preHooks = executionOrder.filter((call) => call.includes('onBeforeRequest'));
    expect(preHooks).toEqual([
      'FirstHook:onBeforeRequest',
      'SecondHook:onBeforeRequest',
      'ThirdHook:onBeforeRequest',
    ]);
  });

  it('should execute post-hooks in reverse priority order (high to low)', async () => {
    await service.getOrCreate(testItemId, testUserId);

    const postHooks = executionOrder.filter((call) => call.includes('onAfterRequest'));
    expect(postHooks).toEqual([
      'ThirdHook:onAfterRequest',
      'SecondHook:onAfterRequest',
      'FirstHook:onAfterRequest',
    ]);
  });
});

describe('DismissibleModule Integration - No Hooks', () => {
  let module: TestingModule;
  let service: DismissibleService;
  let storage: MemoryStorageAdapter;

  const testUserId = 'test-user-123';
  const testItemId = 'test-item-456';

  beforeAll(async () => {
    const moduleOptions: IDismissibleModuleOptions = {
      storage: MemoryStorageModule.forRoot(),
    };

    module = await Test.createTestingModule({
      imports: [DismissibleModule.forRoot(moduleOptions)],
    }).compile();

    service = module.get<DismissibleService>(DismissibleService);
    storage = module.get<MemoryStorageAdapter>(DISMISSIBLE_STORAGE_ADAPTER);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    await storage.deleteAll();
  });

  it('should complete operations without hooks', async () => {
    const createResult = await service.getOrCreate(testItemId, testUserId);
    expect(createResult.created).toBe(true);
    expect(createResult.item.id).toBe(testItemId);

    const getResult = await service.getOrCreate(testItemId, testUserId);
    expect(getResult.created).toBe(false);

    const dismissResult = await service.dismiss(testItemId, testUserId);
    expect(dismissResult.item.dismissedAt).toBeDefined();

    const restoreResult = await service.restore(testItemId, testUserId);
    expect(restoreResult.item.dismissedAt).toBeUndefined();
  });
});
