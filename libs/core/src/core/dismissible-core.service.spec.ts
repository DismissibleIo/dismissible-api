import { Mock, mock } from 'ts-jest-mocker';
import { DismissibleCoreService } from './dismissible-core.service';
import { IDismissibleStorage } from '@dismissible/nestjs-storage';
import { createTestItem, createDismissedTestItem } from '../testing/factories';
import {
  ItemNotFoundException,
  ItemAlreadyDismissedException,
  ItemNotDismissedException,
} from '../exceptions';
import { DismissibleItemFactory } from '@dismissible/nestjs-item';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { IValidationService } from '@dismissible/nestjs-validation';
import { BadRequestException } from '@nestjs/common';
import { DismissibleHelper } from '../utils/dismissible.helper';
import { DateService } from '../utils/date/date.service';

describe('DismissibleCoreService', () => {
  let service: DismissibleCoreService;
  let storage: Mock<IDismissibleStorage>;
  let mockDateService: Mock<DateService>;
  let mockLogger: Mock<IDismissibleLogger>;
  let itemFactory: Mock<DismissibleItemFactory>;
  let validationService: Mock<IValidationService>;
  let dismissibleHelper: Mock<DismissibleHelper>;

  beforeEach(() => {
    mockDateService = mock(DateService);
    mockDateService.getNow.mockReturnValue(new Date('2024-01-15T10:00:00.000Z'));
    mockLogger = mock<IDismissibleLogger>({
      failIfMockNotProvided: false,
    });
    storage = mock<IDismissibleStorage>({
      failIfMockNotProvided: false,
    });
    dismissibleHelper = mock(DismissibleHelper, { failIfMockNotProvided: false });
    itemFactory = mock(DismissibleItemFactory);
    validationService = mock<IValidationService>({ failIfMockNotProvided: false });
    validationService.validateInstance.mockResolvedValue(undefined);
    service = new DismissibleCoreService(
      storage,
      mockDateService,
      mockLogger,
      itemFactory,
      validationService,
      dismissibleHelper,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return item when it exists', async () => {
      const userId = 'user-123';
      const existingItem = createTestItem({ id: 'existing-item', userId });
      storage.get.mockResolvedValue(existingItem);

      const result = await service.get('existing-item', userId);

      expect(result).toEqual(existingItem);
      expect(storage.get).toHaveBeenCalledWith(userId, 'existing-item');
    });

    it('should return null when item does not exist', async () => {
      const userId = 'user-123';
      storage.get.mockResolvedValue(null);

      const result = await service.get('non-existent', userId);

      expect(result).toBeNull();
      expect(storage.get).toHaveBeenCalledWith(userId, 'non-existent');
    });
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const testDate = new Date('2024-01-15T10:00:00.000Z');
      const userId = 'user-123';
      const newItem = createTestItem({ id: 'new-item', userId, createdAt: testDate });

      storage.create.mockResolvedValue(newItem);
      mockDateService.getNow.mockReturnValue(testDate);
      itemFactory.create.mockReturnValue(newItem);

      const result = await service.create('new-item', userId);

      expect(result.id).toBe('new-item');
      expect(result.userId).toBe(userId);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.dismissedAt).toBeUndefined();
      expect(storage.create).toHaveBeenCalledWith(newItem);
    });

    it('should validate item before storage', async () => {
      const userId = 'user-123';
      const testDate = new Date('2024-01-15T10:00:00.000Z');
      const newItem = createTestItem({ id: 'new-item', userId, createdAt: testDate });

      storage.create.mockResolvedValue(newItem);
      mockDateService.getNow.mockReturnValue(testDate);
      itemFactory.create.mockReturnValue(newItem);

      await service.create('new-item', userId);

      expect(validationService.validateInstance).toHaveBeenCalledWith(newItem);
    });

    it('should throw BadRequestException when validation fails', async () => {
      const userId = 'user-123';
      const testDate = new Date('2024-01-15T10:00:00.000Z');
      const newItem = createTestItem({ id: 'new-item', userId, createdAt: testDate });

      mockDateService.getNow.mockReturnValue(testDate);
      itemFactory.create.mockReturnValue(newItem);
      validationService.validateInstance.mockRejectedValue(
        new BadRequestException('id must be a string'),
      );

      await expect(service.create('new-item', userId)).rejects.toThrow(BadRequestException);
      expect(storage.create).not.toHaveBeenCalled();
    });
  });

  describe('getOrCreate', () => {
    it('should create a new item when it does not exist', async () => {
      const testDate = new Date('2024-01-15T10:00:00.000Z');
      const userId = 'user-123';
      const newItem = createTestItem({ id: 'new-item', userId, createdAt: testDate });

      storage.get.mockResolvedValue(null);
      storage.create.mockResolvedValue(newItem);
      mockDateService.getNow.mockReturnValue(testDate);
      itemFactory.create.mockReturnValue(newItem);

      const result = await service.getOrCreate('new-item', userId);

      expect(result.created).toBe(true);
      expect(result.item.id).toBe('new-item');
      expect(result.item.userId).toBe(userId);
      expect(result.item.createdAt).toBeInstanceOf(Date);
      expect(result.item.dismissedAt).toBeUndefined();
      expect(storage.create).toHaveBeenCalledWith(newItem);
    });

    it('should return existing item when it exists', async () => {
      const userId = 'user-123';
      const existingItem = createTestItem({ id: 'existing-item', userId });
      storage.get.mockResolvedValue(existingItem);

      const result = await service.getOrCreate('existing-item', userId);

      expect(result.created).toBe(false);
      expect(result.item).toEqual(existingItem);
      expect(storage.get).toHaveBeenCalledWith(userId, 'existing-item');
    });
  });

  describe('dismiss', () => {
    it('should dismiss an existing item', async () => {
      const userId = 'user-123';
      const item = createTestItem({ id: 'test-item', userId });
      const previousItem = createTestItem({ id: 'test-item', userId });
      const dismissedItem = createDismissedTestItem({ id: 'test-item', userId });
      const testDate = new Date('2024-01-15T12:00:00.000Z');

      storage.get.mockResolvedValue(item);
      storage.update.mockResolvedValue(dismissedItem);
      itemFactory.clone.mockReturnValue(previousItem);
      mockDateService.getNow.mockReturnValue(testDate);
      itemFactory.createDismissed.mockReturnValue(dismissedItem);
      dismissibleHelper.isDismissed.mockReturnValue(false);

      const result = await service.dismiss('test-item', userId);

      expect(result.item.dismissedAt).toBeDefined();
      expect(result.previousItem.dismissedAt).toBeUndefined();
      expect(storage.update).toHaveBeenCalledWith(dismissedItem);
      expect(storage.get).toHaveBeenCalledWith(userId, 'test-item');
    });

    it('should throw ItemNotFoundException for non-existent item', async () => {
      const userId = 'user-123';
      storage.get.mockResolvedValue(null);

      await expect(service.dismiss('non-existent', userId)).rejects.toThrow(ItemNotFoundException);
    });

    it('should throw ItemAlreadyDismissedException for already dismissed item', async () => {
      const userId = 'user-123';
      const dismissedItem = createDismissedTestItem({ id: 'dismissed-item', userId });
      storage.get.mockResolvedValue(dismissedItem);
      dismissibleHelper.isDismissed.mockReturnValue(true);

      await expect(service.dismiss('dismissed-item', userId)).rejects.toThrow(
        ItemAlreadyDismissedException,
      );
    });

    it('should return the previous item state', async () => {
      const userId = 'user-123';
      const item = createTestItem({
        id: 'test-item',
        userId,
      });
      const previousItem = createTestItem({
        id: 'test-item',
        userId,
      });
      const dismissedItem = createDismissedTestItem({
        id: 'test-item',
        userId,
      });
      const testDate = new Date('2024-01-15T12:00:00.000Z');

      storage.get.mockResolvedValue(item);
      storage.update.mockResolvedValue(dismissedItem);
      itemFactory.clone.mockReturnValue(previousItem);
      mockDateService.getNow.mockReturnValue(testDate);
      itemFactory.createDismissed.mockReturnValue(dismissedItem);
      dismissibleHelper.isDismissed.mockReturnValue(false);

      const result = await service.dismiss('test-item', userId);

      expect(result.previousItem.id).toBe(item.id);
      expect(result.previousItem.dismissedAt).toBeUndefined();
    });
  });

  describe('restore', () => {
    it('should restore a dismissed item', async () => {
      const userId = 'user-123';
      const dismissedItem = createDismissedTestItem({ id: 'dismissed-item', userId });
      const previousItem = createDismissedTestItem({ id: 'dismissed-item', userId });
      const restoredItem = createTestItem({ id: 'dismissed-item', userId });

      storage.get.mockResolvedValue(dismissedItem);
      storage.update.mockResolvedValue(restoredItem);
      itemFactory.clone.mockReturnValue(previousItem);
      itemFactory.createRestored.mockReturnValue(restoredItem);
      dismissibleHelper.isDismissed.mockReturnValue(true);

      const result = await service.restore('dismissed-item', userId);

      expect(result.item.dismissedAt).toBeUndefined();
      expect(result.previousItem.dismissedAt).toBeDefined();
      expect(storage.update).toHaveBeenCalledWith(restoredItem);
      expect(storage.get).toHaveBeenCalledWith(userId, 'dismissed-item');
    });

    it('should throw ItemNotFoundException for non-existent item', async () => {
      const userId = 'user-123';
      storage.get.mockResolvedValue(null);

      await expect(service.restore('non-existent', userId)).rejects.toThrow(ItemNotFoundException);
    });

    it('should throw ItemNotDismissedException for non-dismissed item', async () => {
      const userId = 'user-123';
      const item = createTestItem({ id: 'active-item', userId });
      storage.get.mockResolvedValue(item);
      dismissibleHelper.isDismissed.mockReturnValue(false);

      await expect(service.restore('active-item', userId)).rejects.toThrow(
        ItemNotDismissedException,
      );
    });

    it('should return the previous item state', async () => {
      const userId = 'user-123';
      const dismissedItem = createDismissedTestItem({
        id: 'dismissed-item',
        userId,
      });
      const previousItem = createDismissedTestItem({
        id: 'dismissed-item',
        userId,
      });
      const restoredItem = createTestItem({
        id: 'dismissed-item',
        userId,
      });

      storage.get.mockResolvedValue(dismissedItem);
      storage.update.mockResolvedValue(restoredItem);
      itemFactory.clone.mockReturnValue(previousItem);
      itemFactory.createRestored.mockReturnValue(restoredItem);
      dismissibleHelper.isDismissed.mockReturnValue(true);

      const result = await service.restore('dismissed-item', userId);

      expect(result.previousItem.id).toBe(dismissedItem.id);
      expect(result.previousItem.dismissedAt).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should throw BadRequestException when validation fails on create', async () => {
      const userId = 'user-123';
      const testDate = new Date('2024-01-15T10:00:00.000Z');
      const newItem = createTestItem({ id: 'new-item', userId, createdAt: testDate });

      storage.get.mockResolvedValue(null);
      mockDateService.getNow.mockReturnValue(testDate);
      itemFactory.create.mockReturnValue(newItem);
      validationService.validateInstance.mockRejectedValue(
        new BadRequestException('id must be a string'),
      );

      await expect(service.getOrCreate('new-item', userId)).rejects.toThrow(BadRequestException);
      expect(storage.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when validation fails on dismiss', async () => {
      const userId = 'user-123';
      const item = createTestItem({ id: 'test-item', userId });
      const previousItem = createTestItem({ id: 'test-item', userId });
      const dismissedItem = createDismissedTestItem({ id: 'test-item', userId });
      const testDate = new Date('2024-01-15T12:00:00.000Z');

      storage.get.mockResolvedValue(item);
      itemFactory.clone.mockReturnValue(previousItem);
      mockDateService.getNow.mockReturnValue(testDate);
      itemFactory.createDismissed.mockReturnValue(dismissedItem);
      dismissibleHelper.isDismissed.mockReturnValue(false);
      validationService.validateInstance.mockRejectedValue(
        new BadRequestException('dismissedAt must be a date'),
      );

      await expect(service.dismiss('test-item', userId)).rejects.toThrow(BadRequestException);
      expect(storage.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when validation fails on restore', async () => {
      const userId = 'user-123';
      const dismissedItem = createDismissedTestItem({ id: 'dismissed-item', userId });
      const previousItem = createDismissedTestItem({ id: 'dismissed-item', userId });
      const restoredItem = createTestItem({ id: 'dismissed-item', userId });

      storage.get.mockResolvedValue(dismissedItem);
      itemFactory.clone.mockReturnValue(previousItem);
      itemFactory.createRestored.mockReturnValue(restoredItem);
      dismissibleHelper.isDismissed.mockReturnValue(true);
      validationService.validateInstance.mockRejectedValue(
        new BadRequestException('id must be a string'),
      );

      await expect(service.restore('dismissed-item', userId)).rejects.toThrow(BadRequestException);
      expect(storage.update).not.toHaveBeenCalled();
    });

    it('should validate item when creating', async () => {
      const userId = 'user-123';
      const testDate = new Date('2024-01-15T10:00:00.000Z');
      const newItem = createTestItem({ id: 'new-item', userId, createdAt: testDate });

      storage.get.mockResolvedValue(null);
      storage.create.mockResolvedValue(newItem);
      mockDateService.getNow.mockReturnValue(testDate);
      itemFactory.create.mockReturnValue(newItem);

      await service.getOrCreate('new-item', userId);

      expect(validationService.validateInstance).toHaveBeenCalledWith(newItem);
    });

    it('should validate item when dismissing', async () => {
      const userId = 'user-123';
      const item = createTestItem({ id: 'test-item', userId });
      const previousItem = createTestItem({ id: 'test-item', userId });
      const dismissedItem = createDismissedTestItem({ id: 'test-item', userId });
      const testDate = new Date('2024-01-15T12:00:00.000Z');

      storage.get.mockResolvedValue(item);
      storage.update.mockResolvedValue(dismissedItem);
      itemFactory.clone.mockReturnValue(previousItem);
      mockDateService.getNow.mockReturnValue(testDate);
      itemFactory.createDismissed.mockReturnValue(dismissedItem);
      dismissibleHelper.isDismissed.mockReturnValue(false);

      await service.dismiss('test-item', userId);

      expect(validationService.validateInstance).toHaveBeenCalledWith(dismissedItem);
    });

    it('should validate item when restoring', async () => {
      const userId = 'user-123';
      const dismissedItem = createDismissedTestItem({ id: 'dismissed-item', userId });
      const previousItem = createDismissedTestItem({ id: 'dismissed-item', userId });
      const restoredItem = createTestItem({ id: 'dismissed-item', userId });

      storage.get.mockResolvedValue(dismissedItem);
      storage.update.mockResolvedValue(restoredItem);
      itemFactory.clone.mockReturnValue(previousItem);
      itemFactory.createRestored.mockReturnValue(restoredItem);
      dismissibleHelper.isDismissed.mockReturnValue(true);

      await service.restore('dismissed-item', userId);

      expect(validationService.validateInstance).toHaveBeenCalledWith(restoredItem);
    });
  });
});
