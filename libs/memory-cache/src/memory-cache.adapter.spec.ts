import { mock, Mock } from 'ts-jest-mocker';
import { MemoryCacheAdapter } from './memory-cache.adapter';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { DismissibleItemFactory } from '@dismissible/nestjs-item';

describe('MemoryCacheAdapter', () => {
  let adapter: MemoryCacheAdapter;
  let mockLogger: Mock<IDismissibleLogger>;
  let itemFactory: DismissibleItemFactory;

  beforeEach(() => {
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });
    itemFactory = new DismissibleItemFactory();
    adapter = new MemoryCacheAdapter({}, mockLogger);
  });

  describe('get', () => {
    it('should return null when item does not exist', async () => {
      const result = await adapter.get('user-1', 'item-1');

      expect(result).toBeNull();
    });

    it('should return item when it exists', async () => {
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      await adapter.set(item);
      const result = await adapter.get('user-1', 'item-1');

      expect(result).toEqual(item);
    });

    it('should return null for different user with same item id', async () => {
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      await adapter.set(item);
      const result = await adapter.get('user-2', 'item-1');

      expect(result).toBeNull();
    });
  });

  describe('getMany', () => {
    it('should return empty map when no items exist', async () => {
      const result = await adapter.getMany('user-1', ['item-1', 'item-2']);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('should return map with existing items', async () => {
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

      await adapter.set(item1);
      await adapter.set(item2);

      const result = await adapter.getMany('user-1', ['item-1', 'item-2', 'item-3']);

      expect(result.size).toBe(2);
      expect(result.get('item-1')).toEqual(item1);
      expect(result.get('item-2')).toEqual(item2);
      expect(result.has('item-3')).toBe(false);
    });
  });

  describe('set', () => {
    it('should store an item', async () => {
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      await adapter.set(item);

      expect(adapter.size).toBe(1);

      const retrieved = await adapter.get('user-1', 'item-1');
      expect(retrieved).toEqual(item);
    });
  });

  describe('setMany', () => {
    it('should store multiple items', async () => {
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

      await adapter.setMany([item1, item2]);

      expect(adapter.size).toBe(2);
      expect(await adapter.get('user-1', 'item-1')).toEqual(item1);
      expect(await adapter.get('user-1', 'item-2')).toEqual(item2);
    });
  });

  describe('delete', () => {
    it('should delete an item', async () => {
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      await adapter.set(item);
      expect(adapter.size).toBe(1);

      await adapter.delete('user-1', 'item-1');

      expect(adapter.size).toBe(0);
      expect(await adapter.get('user-1', 'item-1')).toBeNull();
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple items', async () => {
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

      await adapter.setMany([item1, item2]);
      expect(adapter.size).toBe(2);

      await adapter.deleteMany('user-1', ['item-1', 'item-2']);

      expect(adapter.size).toBe(0);
      expect(await adapter.get('user-1', 'item-1')).toBeNull();
      expect(await adapter.get('user-1', 'item-2')).toBeNull();
    });
  });
});
