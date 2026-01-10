import { mock, Mock } from 'ts-jest-mocker';
import { MemoryStorageAdapter } from './memory-storage.adapter';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { DismissibleItemFactory } from '@dismissible/nestjs-item';

describe('MemoryStorageAdapter', () => {
  let adapter: MemoryStorageAdapter;
  let mockLogger: Mock<IDismissibleLogger>;
  let itemFactory: DismissibleItemFactory;

  beforeEach(() => {
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });
    itemFactory = new DismissibleItemFactory();
    adapter = new MemoryStorageAdapter({}, mockLogger);
  });

  describe('get', () => {
    it('should return null when item does not exist', async () => {
      const result = await adapter.get('user-1', 'item-1');

      expect(result).toBeNull();
      expect(mockLogger.debug).toHaveBeenCalledWith('Storage get', {
        userId: 'user-1',
        itemId: 'item-1',
        key: 'user-1:item-1',
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('Storage miss', {
        userId: 'user-1',
        itemId: 'item-1',
      });
    });

    it('should return item when it exists', async () => {
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      await adapter.create(item);
      const result = await adapter.get('user-1', 'item-1');

      expect(result).toEqual(item);
      expect(mockLogger.debug).toHaveBeenCalledWith('Storage hit', {
        userId: 'user-1',
        itemId: 'item-1',
      });
    });

    it('should return null for different user with same item id', async () => {
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      await adapter.create(item);
      const result = await adapter.get('user-2', 'item-1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and store a new item', async () => {
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      const result = await adapter.create(item);

      expect(result).toEqual(item);
      expect(adapter.size).toBe(1);
      expect(mockLogger.debug).toHaveBeenCalledWith('Storage create', {
        userId: 'user-1',
        itemId: 'item-1',
        key: 'user-1:item-1',
      });

      const retrieved = await adapter.get('user-1', 'item-1');
      expect(retrieved).toEqual(item);
    });

    it('should create multiple items for different users', async () => {
      const item1 = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });
      const item2 = itemFactory.create({
        id: 'item-1',
        userId: 'user-2',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      await adapter.create(item1);
      await adapter.create(item2);

      expect(adapter.size).toBe(2);
      expect(await adapter.get('user-1', 'item-1')).toEqual(item1);
      expect(await adapter.get('user-2', 'item-1')).toEqual(item2);
    });
  });

  describe('update', () => {
    it('should update an existing item', async () => {
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      await adapter.create(item);

      const updatedItem = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        dismissedAt: new Date('2024-01-15T12:00:00.000Z'),
      });

      const result = await adapter.update(updatedItem);

      expect(result).toEqual(updatedItem);
      expect(adapter.size).toBe(1);
      expect(mockLogger.debug).toHaveBeenCalledWith('Storage update', {
        userId: 'user-1',
        itemId: 'item-1',
        key: 'user-1:item-1',
      });

      const retrieved = await adapter.get('user-1', 'item-1');
      expect(retrieved).toEqual(updatedItem);
    });

    it('should create item if it does not exist when updating', async () => {
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      const result = await adapter.update(item);

      expect(result).toEqual(item);
      expect(adapter.size).toBe(1);
      const retrieved = await adapter.get('user-1', 'item-1');
      expect(retrieved).toEqual(item);
    });
  });

  describe('clear', () => {
    it('should clear all stored items', async () => {
      const item1 = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });
      const item2 = itemFactory.create({
        id: 'item-2',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      await adapter.create(item1);
      await adapter.create(item2);
      expect(adapter.size).toBe(2);

      await adapter.deleteAll();

      expect(adapter.size).toBe(0);
      expect(mockLogger.debug).toHaveBeenCalledWith('Storage deleteAll', {
        previousSize: 2,
      });
      expect(await adapter.get('user-1', 'item-1')).toBeNull();
      expect(await adapter.get('user-1', 'item-2')).toBeNull();
    });
  });

  describe('size', () => {
    it('should return the number of stored items', async () => {
      expect(adapter.size).toBe(0);

      const item1 = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });
      const item2 = itemFactory.create({
        id: 'item-2',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      await adapter.create(item1);
      expect(adapter.size).toBe(1);

      await adapter.create(item2);
      expect(adapter.size).toBe(2);
    });
  });

  describe('LRU eviction', () => {
    it('should limit cache size to max items', async () => {
      // Create 5001 items to exceed the default max of 5000
      for (let i = 0; i < 5001; i++) {
        const item = itemFactory.create({
          id: `item-${i}`,
          userId: `user-${i}`,
          createdAt: new Date('2024-01-15T10:00:00.000Z'),
        });
        await adapter.create(item);
      }

      // Cache should be limited to max items
      expect(adapter.size).toBe(5000);
    });

    it('should evict items when max exceeded', async () => {
      // Create items up to the limit
      for (let i = 0; i < 5000; i++) {
        const item = itemFactory.create({
          id: `item-${i}`,
          userId: `user-${i}`,
          createdAt: new Date('2024-01-15T10:00:00.000Z'),
        });
        await adapter.create(item);
      }

      // Verify first item exists
      expect(await adapter.get('user-0', 'item-0')).not.toBeNull();

      // Add one more to trigger eviction
      const item5000 = itemFactory.create({
        id: 'item-5000',
        userId: 'user-5000',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });
      await adapter.create(item5000);

      // Size should still be 5000
      expect(adapter.size).toBe(5000);
      // New item should be accessible
      expect(await adapter.get('user-5000', 'item-5000')).not.toBeNull();
    });
  });
});
