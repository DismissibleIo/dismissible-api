import { mock, Mock } from 'ts-jest-mocker';
import { ForbiddenException } from '@nestjs/common';
import { HookRunner } from './hook-runner.service';
import { IDismissibleLifecycleHook } from '@dismissible/nestjs-hooks';
import { createTestItem, createTestContext } from '../testing/factories';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';

describe('HookRunner', () => {
  let hookRunner: HookRunner;
  let mockLogger: Mock<IDismissibleLogger>;

  const testUserId = 'test-user-id';

  beforeEach(() => {
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });
  });

  describe('with no hooks', () => {
    beforeEach(() => {
      hookRunner = new HookRunner([], mockLogger);
    });

    it('should return proceed: true for pre-request', async () => {
      const context = createTestContext();
      const result = await hookRunner.runPreRequest('test-id', testUserId, context);

      expect(result.proceed).toBe(true);
      expect(result.id).toBe('test-id');
      expect(result.userId).toBe(testUserId);
      expect(result.context).toEqual(context);
    });

    it('should complete post-request without error', async () => {
      const item = createTestItem();
      const context = createTestContext();

      await expect(
        hookRunner.runPostRequest('test-id', item, testUserId, context),
      ).resolves.not.toThrow();
    });
  });

  describe('with hooks', () => {
    it('should execute hooks in priority order (low to high) for pre-hooks', async () => {
      const executionOrder: number[] = [];

      const hook1: IDismissibleLifecycleHook = {
        priority: 10,
        onBeforeRequest: jest.fn(async () => {
          executionOrder.push(10);
          return { proceed: true };
        }),
      };

      const hook2: IDismissibleLifecycleHook = {
        priority: 5,
        onBeforeRequest: jest.fn(async () => {
          executionOrder.push(5);
          return { proceed: true };
        }),
      };

      const hook3: IDismissibleLifecycleHook = {
        priority: 15,
        onBeforeRequest: jest.fn(async () => {
          executionOrder.push(15);
          return { proceed: true };
        }),
      };

      hookRunner = new HookRunner([hook1, hook2, hook3], mockLogger);
      await hookRunner.runPreRequest('test-id', testUserId, createTestContext());

      expect(executionOrder).toEqual([5, 10, 15]);
    });

    it('should execute hooks in reverse priority order for post-hooks', async () => {
      const executionOrder: number[] = [];

      const hook1: IDismissibleLifecycleHook = {
        priority: 10,
        onAfterRequest: jest.fn(async () => {
          executionOrder.push(10);
        }),
      };

      const hook2: IDismissibleLifecycleHook = {
        priority: 5,
        onAfterRequest: jest.fn(async () => {
          executionOrder.push(5);
        }),
      };

      const hook3: IDismissibleLifecycleHook = {
        priority: 15,
        onAfterRequest: jest.fn(async () => {
          executionOrder.push(15);
        }),
      };

      hookRunner = new HookRunner([hook1, hook2, hook3], mockLogger);
      await hookRunner.runPostRequest('test-id', createTestItem(), testUserId, createTestContext());

      expect(executionOrder).toEqual([15, 10, 5]);
    });

    it('should block operation when pre-hook returns proceed: false', async () => {
      const blockingHook: IDismissibleLifecycleHook = {
        onBeforeRequest: jest.fn(async () => ({
          proceed: false,
          reason: 'Rate limit exceeded',
        })),
      };

      hookRunner = new HookRunner([blockingHook], mockLogger);
      const result = await hookRunner.runPreRequest('test-id', testUserId, createTestContext());

      expect(result.proceed).toBe(false);
      expect(result.reason).toBe('Rate limit exceeded');
    });

    it('should apply mutations from pre-hooks', async () => {
      const mutatingHook: IDismissibleLifecycleHook = {
        onBeforeRequest: jest.fn(async () => ({
          proceed: true,
          mutations: {
            id: 'mutated-id',
            userId: 'mutated-user',
          },
        })),
      };

      hookRunner = new HookRunner([mutatingHook], mockLogger);
      const result = await hookRunner.runPreRequest('original-id', testUserId, createTestContext());

      expect(result.id).toBe('mutated-id');
      expect(result.userId).toBe('mutated-user');
    });

    it('should pass mutations through multiple hooks', async () => {
      const hook1: IDismissibleLifecycleHook = {
        priority: 1,
        onBeforeRequest: jest.fn(async (itemId) => ({
          proceed: true,
          mutations: { id: `${itemId}-hook1` },
        })),
      };

      const hook2: IDismissibleLifecycleHook = {
        priority: 2,
        onBeforeRequest: jest.fn(async (itemId) => ({
          proceed: true,
          mutations: { id: `${itemId}-hook2` },
        })),
      };

      hookRunner = new HookRunner([hook1, hook2], mockLogger);
      const result = await hookRunner.runPreRequest('original', testUserId, createTestContext());

      expect(result.id).toBe('original-hook1-hook2');
    });

    it('should apply context mutations from pre-hooks', async () => {
      const context = createTestContext();

      const mutatingHook: IDismissibleLifecycleHook = {
        onBeforeRequest: jest.fn(async () => ({
          proceed: true,
          mutations: {
            context: { headers: { authorization: 'Bearer mutated-token' } },
          },
        })),
      };

      hookRunner = new HookRunner([mutatingHook], mockLogger);
      const result = await hookRunner.runPreRequest('test-id', testUserId, context);

      expect(result.context).toEqual({
        ...context,
        headers: { authorization: 'Bearer mutated-token' },
      });
    });

    it('should ignore context mutation when no context provided', async () => {
      const mutatingHook: IDismissibleLifecycleHook = {
        onBeforeRequest: jest.fn(async () => ({
          proceed: true,
          mutations: {
            context: { headers: { authorization: 'Bearer token' } },
          },
        })),
      };

      hookRunner = new HookRunner([mutatingHook], mockLogger);
      const result = await hookRunner.runPreRequest('test-id', testUserId, undefined);

      expect(result.context).toBeUndefined();
    });

    it('should handle hooks with default priority (undefined)', async () => {
      const executionOrder: string[] = [];

      const hook1: IDismissibleLifecycleHook = {
        priority: 5,
        onBeforeRequest: jest.fn(async () => {
          executionOrder.push('priority-5');
          return { proceed: true };
        }),
      };

      const hook2: IDismissibleLifecycleHook = {
        onBeforeRequest: jest.fn(async () => {
          executionOrder.push('priority-default');
          return { proceed: true };
        }),
      };

      hookRunner = new HookRunner([hook1, hook2], mockLogger);
      await hookRunner.runPreRequest('test-id', testUserId, createTestContext());

      expect(executionOrder).toEqual(['priority-default', 'priority-5']);
    });
  });

  describe('error handling', () => {
    it('should throw error from pre-hook', async () => {
      const errorHook: IDismissibleLifecycleHook = {
        onBeforeRequest: jest.fn(async () => {
          throw new Error('Hook error');
        }),
      };

      hookRunner = new HookRunner([errorHook], mockLogger);

      await expect(
        hookRunner.runPreRequest('test-id', testUserId, createTestContext()),
      ).rejects.toThrow('Hook error');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw non-Error from pre-hook', async () => {
      const errorHook: IDismissibleLifecycleHook = {
        onBeforeRequest: jest.fn(async () => {
          throw 'string error';
        }),
      };

      hookRunner = new HookRunner([errorHook], mockLogger);

      await expect(
        hookRunner.runPreRequest('test-id', testUserId, createTestContext()),
      ).rejects.toBe('string error');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log but not throw errors from post-hooks', async () => {
      const errorHook: IDismissibleLifecycleHook = {
        onAfterRequest: jest.fn(async () => {
          throw new Error('Post-hook error');
        }),
      };

      hookRunner = new HookRunner([errorHook], mockLogger);

      await expect(
        hookRunner.runPostRequest('test-id', createTestItem(), testUserId, createTestContext()),
      ).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log but not throw non-Error from post-hooks', async () => {
      const errorHook: IDismissibleLifecycleHook = {
        onAfterRequest: jest.fn(async () => {
          throw 'string post-hook error';
        }),
      };

      hookRunner = new HookRunner([errorHook], mockLogger);

      await expect(
        hookRunner.runPostRequest('test-id', createTestItem(), testUserId, createTestContext()),
      ).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('throwIfBlocked', () => {
    it('should throw ForbiddenException when blocked', () => {
      expect(() =>
        HookRunner.throwIfBlocked({
          proceed: false,
          id: 'test',
          userId: testUserId,
          context: createTestContext(),
          reason: 'Not allowed',
        }),
      ).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException with default reason when blocked without reason', () => {
      expect(() =>
        HookRunner.throwIfBlocked({
          proceed: false,
          id: 'test',
          userId: testUserId,
          context: createTestContext(),
        }),
      ).toThrow('Operation blocked by lifecycle hook');
    });

    it('should not throw when not blocked', () => {
      expect(() =>
        HookRunner.throwIfBlocked({
          proceed: true,
          id: 'test',
          userId: testUserId,
          context: createTestContext(),
        }),
      ).not.toThrow();
    });
  });

  describe('runPreGet and runPostGet', () => {
    it('should pass item to onBeforeGet hook', async () => {
      const item = createTestItem();
      const context = createTestContext();

      const hook: IDismissibleLifecycleHook = {
        onBeforeGet: jest.fn().mockResolvedValue({ proceed: true }),
      };

      hookRunner = new HookRunner([hook], mockLogger);
      await hookRunner.runPreGet('test-id', item, testUserId, context);

      expect(hook.onBeforeGet).toHaveBeenCalledWith('test-id', item, testUserId, context);
    });

    it('should block operation when onBeforeGet returns proceed: false', async () => {
      const item = createTestItem();
      const context = createTestContext();

      const blockingHook: IDismissibleLifecycleHook = {
        onBeforeGet: jest.fn().mockResolvedValue({
          proceed: false,
          reason: 'Item is in invalid state',
        }),
      };

      hookRunner = new HookRunner([blockingHook], mockLogger);
      const result = await hookRunner.runPreGet('test-id', item, testUserId, context);

      expect(result.proceed).toBe(false);
      expect(result.reason).toBe('Item is in invalid state');
    });

    it('should run onAfterGet hook', async () => {
      const item = createTestItem();
      const context = createTestContext();

      const hook: IDismissibleLifecycleHook = {
        onAfterGet: jest.fn(),
      };

      hookRunner = new HookRunner([hook], mockLogger);
      await hookRunner.runPostGet('test-id', item, testUserId, context);

      expect(hook.onAfterGet).toHaveBeenCalledWith('test-id', item, testUserId, context);
    });

    it('should apply mutations from onBeforeGet hook', async () => {
      const item = createTestItem();
      const context = createTestContext();

      const mutatingHook: IDismissibleLifecycleHook = {
        onBeforeGet: jest.fn().mockResolvedValue({
          proceed: true,
          mutations: {
            id: 'mutated-id',
          },
        }),
      };

      hookRunner = new HookRunner([mutatingHook], mockLogger);
      const result = await hookRunner.runPreGet('original-id', item, testUserId, context);

      expect(result.id).toBe('mutated-id');
    });

    it('should apply userId mutation from onBeforeGet hook', async () => {
      const item = createTestItem();
      const context = createTestContext();

      const mutatingHook: IDismissibleLifecycleHook = {
        onBeforeGet: jest.fn().mockResolvedValue({
          proceed: true,
          mutations: {
            userId: 'mutated-user-id',
          },
        }),
      };

      hookRunner = new HookRunner([mutatingHook], mockLogger);
      const result = await hookRunner.runPreGet('test-id', item, testUserId, context);

      expect(result.userId).toBe('mutated-user-id');
    });

    it('should apply context mutation from onBeforeGet hook', async () => {
      const item = createTestItem();
      const context = createTestContext();

      const mutatingHook: IDismissibleLifecycleHook = {
        onBeforeGet: jest.fn().mockResolvedValue({
          proceed: true,
          mutations: {
            context: { headers: { authorization: 'Bearer custom-token' } },
          },
        }),
      };

      hookRunner = new HookRunner([mutatingHook], mockLogger);
      const result = await hookRunner.runPreGet('test-id', item, testUserId, context);

      expect(result.context).toEqual({
        ...context,
        headers: { authorization: 'Bearer custom-token' },
      });
    });

    it('should ignore context mutation when no context provided to onBeforeGet', async () => {
      const item = createTestItem();

      const mutatingHook: IDismissibleLifecycleHook = {
        onBeforeGet: jest.fn().mockResolvedValue({
          proceed: true,
          mutations: {
            context: { headers: { authorization: 'Bearer token' } },
          },
        }),
      };

      hookRunner = new HookRunner([mutatingHook], mockLogger);
      const result = await hookRunner.runPreGet('test-id', item, testUserId, undefined);

      expect(result.context).toBeUndefined();
    });

    it('should throw error from onBeforeGet hook', async () => {
      const item = createTestItem();
      const context = createTestContext();

      const errorHook: IDismissibleLifecycleHook = {
        onBeforeGet: jest.fn().mockRejectedValue(new Error('Get hook error')),
      };

      hookRunner = new HookRunner([errorHook], mockLogger);

      await expect(hookRunner.runPreGet('test-id', item, testUserId, context)).rejects.toThrow(
        'Get hook error',
      );

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw non-Error from onBeforeGet hook', async () => {
      const item = createTestItem();
      const context = createTestContext();

      const errorHook: IDismissibleLifecycleHook = {
        onBeforeGet: jest.fn().mockRejectedValue('string error'),
      };

      hookRunner = new HookRunner([errorHook], mockLogger);

      await expect(hookRunner.runPreGet('test-id', item, testUserId, context)).rejects.toBe(
        'string error',
      );

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('runPreCreate, runPreDismiss, runPreRestore mutations', () => {
    it('should apply mutations from onBeforeCreate hook', async () => {
      const context = createTestContext();

      const mutatingHook: IDismissibleLifecycleHook = {
        onBeforeCreate: jest.fn().mockResolvedValue({
          proceed: true,
          mutations: {
            id: 'mutated-create-id',
            userId: 'mutated-create-user',
          },
        }),
      };

      hookRunner = new HookRunner([mutatingHook], mockLogger);
      const result = await hookRunner.runPreCreate('original-id', testUserId, context);

      expect(result.id).toBe('mutated-create-id');
      expect(result.userId).toBe('mutated-create-user');
    });

    it('should apply context mutation from onBeforeCreate when context is provided', async () => {
      const context = createTestContext();

      const mutatingHook: IDismissibleLifecycleHook = {
        onBeforeCreate: jest.fn().mockResolvedValue({
          proceed: true,
          mutations: {
            context: { headers: { authorization: 'Bearer create-token' } },
          },
        }),
      };

      hookRunner = new HookRunner([mutatingHook], mockLogger);
      const result = await hookRunner.runPreCreate('test-id', testUserId, context);

      expect(result.context).toEqual({
        ...context,
        headers: { authorization: 'Bearer create-token' },
      });
    });

    it('should block operation when onBeforeDismiss returns proceed: false', async () => {
      const blockingHook: IDismissibleLifecycleHook = {
        onBeforeDismiss: jest.fn().mockResolvedValue({
          proceed: false,
          reason: 'Cannot dismiss this item',
        }),
      };

      hookRunner = new HookRunner([blockingHook], mockLogger);
      const result = await hookRunner.runPreDismiss('test-id', testUserId, createTestContext());

      expect(result.proceed).toBe(false);
      expect(result.reason).toBe('Cannot dismiss this item');
    });

    it('should apply mutations from onBeforeRestore hook', async () => {
      const context = createTestContext();

      const mutatingHook: IDismissibleLifecycleHook = {
        onBeforeRestore: jest.fn().mockResolvedValue({
          proceed: true,
          mutations: {
            id: 'mutated-restore-id',
          },
        }),
      };

      hookRunner = new HookRunner([mutatingHook], mockLogger);
      const result = await hookRunner.runPreRestore('original-id', testUserId, context);

      expect(result.id).toBe('mutated-restore-id');
    });

    it('should throw error from onBeforeCreate hook', async () => {
      const errorHook: IDismissibleLifecycleHook = {
        onBeforeCreate: jest.fn().mockRejectedValue(new Error('Create hook error')),
      };

      hookRunner = new HookRunner([errorHook], mockLogger);

      await expect(
        hookRunner.runPreCreate('test-id', testUserId, createTestContext()),
      ).rejects.toThrow('Create hook error');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should throw non-Error from onBeforeDismiss hook', async () => {
      const errorHook: IDismissibleLifecycleHook = {
        onBeforeDismiss: jest.fn().mockRejectedValue('dismiss string error'),
      };

      hookRunner = new HookRunner([errorHook], mockLogger);

      await expect(
        hookRunner.runPreDismiss('test-id', testUserId, createTestContext()),
      ).rejects.toBe('dismiss string error');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('post-hook error handling', () => {
    it('should log but not throw Error from onAfterCreate', async () => {
      const errorHook: IDismissibleLifecycleHook = {
        onAfterCreate: jest.fn().mockRejectedValue(new Error('After create error')),
      };

      hookRunner = new HookRunner([errorHook], mockLogger);

      await expect(
        hookRunner.runPostCreate('test-id', createTestItem(), testUserId, createTestContext()),
      ).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log but not throw non-Error from onAfterDismiss', async () => {
      const errorHook: IDismissibleLifecycleHook = {
        onAfterDismiss: jest.fn().mockRejectedValue('dismiss post error'),
      };

      hookRunner = new HookRunner([errorHook], mockLogger);

      await expect(
        hookRunner.runPostDismiss('test-id', createTestItem(), testUserId, createTestContext()),
      ).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log but not throw Error from onAfterRestore', async () => {
      const errorHook: IDismissibleLifecycleHook = {
        onAfterRestore: jest.fn().mockRejectedValue(new Error('After restore error')),
      };

      hookRunner = new HookRunner([errorHook], mockLogger);

      await expect(
        hookRunner.runPostRestore('test-id', createTestItem(), testUserId, createTestContext()),
      ).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should log but not throw non-Error from onAfterGet', async () => {
      const errorHook: IDismissibleLifecycleHook = {
        onAfterGet: jest.fn().mockRejectedValue('get post error'),
      };

      hookRunner = new HookRunner([errorHook], mockLogger);

      await expect(
        hookRunner.runPostGet('test-id', createTestItem(), testUserId, createTestContext()),
      ).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('all hook methods', () => {
    let allMethodsHook: IDismissibleLifecycleHook;

    beforeEach(() => {
      allMethodsHook = {
        priority: 0,
        onBeforeRequest: jest.fn().mockResolvedValue({ proceed: true }),
        onAfterRequest: jest.fn(),
        onBeforeGet: jest.fn().mockResolvedValue({ proceed: true }),
        onAfterGet: jest.fn(),
        onBeforeCreate: jest.fn().mockResolvedValue({ proceed: true }),
        onAfterCreate: jest.fn(),
        onBeforeDismiss: jest.fn().mockResolvedValue({ proceed: true }),
        onAfterDismiss: jest.fn(),
        onBeforeRestore: jest.fn().mockResolvedValue({ proceed: true }),
        onAfterRestore: jest.fn(),
      };

      hookRunner = new HookRunner([allMethodsHook], mockLogger);
    });

    it('should run pre and post request hooks', async () => {
      const context = createTestContext();
      const item = createTestItem();

      await hookRunner.runPreRequest('test-id', testUserId, context);
      await hookRunner.runPostRequest('test-id', item, testUserId, context);

      expect(allMethodsHook.onBeforeRequest).toHaveBeenCalledWith('test-id', testUserId, context);
      expect(allMethodsHook.onAfterRequest).toHaveBeenCalledWith(
        'test-id',
        item,
        testUserId,
        context,
      );
    });

    it('should run pre and post get hooks', async () => {
      const context = createTestContext();
      const item = createTestItem();

      await hookRunner.runPreGet('test-id', item, testUserId, context);
      await hookRunner.runPostGet('test-id', item, testUserId, context);

      expect(allMethodsHook.onBeforeGet).toHaveBeenCalledWith('test-id', item, testUserId, context);
      expect(allMethodsHook.onAfterGet).toHaveBeenCalledWith('test-id', item, testUserId, context);
    });

    it('should run pre and post create hooks', async () => {
      const context = createTestContext();
      const item = createTestItem();

      await hookRunner.runPreCreate('test-id', testUserId, context);
      await hookRunner.runPostCreate('test-id', item, testUserId, context);

      expect(allMethodsHook.onBeforeCreate).toHaveBeenCalledWith('test-id', testUserId, context);
      expect(allMethodsHook.onAfterCreate).toHaveBeenCalledWith(
        'test-id',
        item,
        testUserId,
        context,
      );
    });

    it('should run pre and post dismiss hooks', async () => {
      const context = createTestContext();
      const item = createTestItem();

      await hookRunner.runPreDismiss('test-id', testUserId, context);
      await hookRunner.runPostDismiss('test-id', item, testUserId, context);

      expect(allMethodsHook.onBeforeDismiss).toHaveBeenCalledWith('test-id', testUserId, context);
      expect(allMethodsHook.onAfterDismiss).toHaveBeenCalledWith(
        'test-id',
        item,
        testUserId,
        context,
      );
    });

    it('should run pre and post restore hooks', async () => {
      const context = createTestContext();
      const item = createTestItem();

      await hookRunner.runPreRestore('test-id', testUserId, context);
      await hookRunner.runPostRestore('test-id', item, testUserId, context);

      expect(allMethodsHook.onBeforeRestore).toHaveBeenCalledWith('test-id', testUserId, context);
      expect(allMethodsHook.onAfterRestore).toHaveBeenCalledWith(
        'test-id',
        item,
        testUserId,
        context,
      );
    });
  });
});
