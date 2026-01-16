import { mock, Mock } from 'ts-jest-mocker';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DismissibleService } from './dismissible.service';
import { DismissibleCoreService } from './dismissible-core.service';
import { HookRunner, IHookRunResult } from './hook-runner.service';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { IValidationService } from '@dismissible/nestjs-validation';
import { DismissibleEvents } from '../events';
import { createTestItem, createTestContext } from '../testing/factories';

describe('DismissibleService', () => {
  let service: DismissibleService;
  let mockCoreService: Mock<DismissibleCoreService>;
  let mockHookRunner: Mock<HookRunner>;
  let mockEventEmitter: Mock<EventEmitter2>;
  let mockLogger: Mock<IDismissibleLogger>;
  let mockValidationService: Mock<IValidationService>;

  const testUserId = 'test-user-id';

  const createHookResult = (id: string, userId = testUserId): IHookRunResult => ({
    proceed: true,
    id,
    userId,
    context: createTestContext(),
  });

  beforeEach(() => {
    mockCoreService = mock(DismissibleCoreService, { failIfMockNotProvided: false });
    mockHookRunner = mock(HookRunner, { failIfMockNotProvided: false });
    mockEventEmitter = mock(EventEmitter2, { failIfMockNotProvided: false });
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });
    mockValidationService = mock<IValidationService>({ failIfMockNotProvided: false });

    mockValidationService.validateDto.mockResolvedValue({} as never);

    service = new DismissibleService(
      mockCoreService,
      mockHookRunner,
      mockEventEmitter,
      mockLogger,
      mockValidationService,
    );
  });

  describe('getOrCreate', () => {
    it('should run request and get hooks for existing item', async () => {
      const item = createTestItem({ id: 'existing-item' });
      const context = createTestContext();

      mockHookRunner.runPreRequest.mockResolvedValue(createHookResult('existing-item'));
      mockHookRunner.runPreGet.mockResolvedValue(createHookResult('existing-item'));
      mockCoreService.get.mockResolvedValue(item);

      const result = await service.getOrCreate('existing-item', testUserId, context);

      expect(mockHookRunner.runPreRequest).toHaveBeenCalled();
      expect(mockCoreService.get).toHaveBeenCalledWith('existing-item', testUserId);
      expect(mockHookRunner.runPreGet).toHaveBeenCalledWith(
        'existing-item',
        item,
        testUserId,
        expect.anything(),
      );
      expect(mockHookRunner.runPostGet).toHaveBeenCalled();
      expect(mockHookRunner.runPostRequest).toHaveBeenCalled();
      expect(mockCoreService.create).not.toHaveBeenCalled();
      expect(mockHookRunner.runPreCreate).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        DismissibleEvents.ITEM_RETRIEVED,
        expect.anything(),
      );
      expect(result.created).toBe(false);
    });

    it('should run pre-create hooks BEFORE creating for new item', async () => {
      const item = createTestItem({ id: 'new-item' });
      const context = createTestContext();
      const callOrder: string[] = [];

      mockHookRunner.runPreRequest.mockResolvedValue(createHookResult('new-item'));
      mockCoreService.get.mockResolvedValue(null);
      mockHookRunner.runPreCreate.mockImplementation(async () => {
        callOrder.push('runPreCreate');
        return createHookResult('new-item');
      });
      mockCoreService.create.mockImplementation(async () => {
        callOrder.push('create');
        return item;
      });

      const result = await service.getOrCreate('new-item', testUserId, context);

      expect(callOrder).toEqual(['runPreCreate', 'create']);
      expect(mockHookRunner.runPreRequest).toHaveBeenCalled();
      expect(mockHookRunner.runPreCreate).toHaveBeenCalled();
      expect(mockCoreService.create).toHaveBeenCalledWith('new-item', testUserId);
      expect(mockHookRunner.runPostCreate).toHaveBeenCalled();
      expect(mockHookRunner.runPostRequest).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        DismissibleEvents.ITEM_CREATED,
        expect.anything(),
      );
      expect(result.created).toBe(true);
    });

    it('should NOT create item when pre-create hook blocks the operation', async () => {
      const context = createTestContext();

      mockHookRunner.runPreRequest.mockResolvedValue(createHookResult('new-item'));
      mockCoreService.get.mockResolvedValue(null);
      mockHookRunner.runPreCreate.mockResolvedValue({
        proceed: false,
        reason: 'Plan limit reached',
        id: 'new-item',
        userId: testUserId,
        context: createTestContext(),
      });

      await expect(service.getOrCreate('new-item', testUserId, context)).rejects.toThrow();

      expect(mockCoreService.create).not.toHaveBeenCalled();
      expect(mockHookRunner.runPostCreate).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(
        DismissibleEvents.ITEM_CREATED,
        expect.anything(),
      );
    });

    it('should NOT return existing item when pre-get hook blocks the operation', async () => {
      const item = createTestItem({ id: 'existing-item' });
      const context = createTestContext();

      mockHookRunner.runPreRequest.mockResolvedValue(createHookResult('existing-item'));
      mockCoreService.get.mockResolvedValue(item);
      mockHookRunner.runPreGet.mockResolvedValue({
        proceed: false,
        reason: 'Item access denied',
        id: 'existing-item',
        userId: testUserId,
        context: createTestContext(),
      });

      await expect(service.getOrCreate('existing-item', testUserId, context)).rejects.toThrow();

      expect(mockHookRunner.runPostGet).not.toHaveBeenCalled();
      expect(mockHookRunner.runPostRequest).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalledWith(
        DismissibleEvents.ITEM_RETRIEVED,
        expect.anything(),
      );
    });
  });

  describe('dismiss', () => {
    it('should run hooks, call core service, and emit ITEM_DISMISSED event', async () => {
      const item = createTestItem({ id: 'test-item' });
      const previousItem = createTestItem({ id: 'test-item' });
      const context = createTestContext();

      mockHookRunner.runPreRequest.mockResolvedValue(createHookResult('test-item'));
      mockHookRunner.runPreDismiss.mockResolvedValue(createHookResult('test-item'));
      mockCoreService.dismiss.mockResolvedValue({ item, previousItem });

      const result = await service.dismiss('test-item', testUserId, context);

      expect(mockHookRunner.runPreRequest).toHaveBeenCalled();
      expect(mockHookRunner.runPreDismiss).toHaveBeenCalled();
      expect(mockCoreService.dismiss).toHaveBeenCalledWith('test-item', testUserId);
      expect(mockHookRunner.runPostDismiss).toHaveBeenCalled();
      expect(mockHookRunner.runPostRequest).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        DismissibleEvents.ITEM_DISMISSED,
        expect.anything(),
      );
      expect(result.item).toEqual(item);
    });
  });

  describe('restore', () => {
    it('should run hooks, call core service, and emit ITEM_RESTORED event', async () => {
      const item = createTestItem({ id: 'test-item' });
      const previousItem = createTestItem({ id: 'test-item' });
      const context = createTestContext();

      mockHookRunner.runPreRequest.mockResolvedValue(createHookResult('test-item'));
      mockHookRunner.runPreRestore.mockResolvedValue(createHookResult('test-item'));
      mockCoreService.restore.mockResolvedValue({ item, previousItem });

      const result = await service.restore('test-item', testUserId, context);

      expect(mockHookRunner.runPreRequest).toHaveBeenCalled();
      expect(mockHookRunner.runPreRestore).toHaveBeenCalled();
      expect(mockCoreService.restore).toHaveBeenCalledWith('test-item', testUserId);
      expect(mockHookRunner.runPostRestore).toHaveBeenCalled();
      expect(mockHookRunner.runPostRequest).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        DismissibleEvents.ITEM_RESTORED,
        expect.anything(),
      );
      expect(result.item).toEqual(item);
    });
  });

  describe('logging', () => {
    it('should log debug messages for operations', async () => {
      const item = createTestItem({ id: 'test-item' });
      const context = createTestContext();

      mockHookRunner.runPreRequest.mockResolvedValue(createHookResult('test-item'));
      mockHookRunner.runPreGet.mockResolvedValue(createHookResult('test-item'));
      mockCoreService.get.mockResolvedValue(item);

      await service.getOrCreate('test-item', testUserId, context);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('getOrCreate called'),
        expect.any(Object),
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('getOrCreate completed'),
        expect.any(Object),
      );
    });
  });
});
