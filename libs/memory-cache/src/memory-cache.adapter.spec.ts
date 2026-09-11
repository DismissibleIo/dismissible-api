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

  describe('capacity and expiration', () => {
    it('evicts the least recently used item at the configured capacity', async () => {
      adapter = new MemoryCacheAdapter({ maxItems: 2 }, mockLogger);
      const items = ['first', 'second', 'third'].map((id) =>
        itemFactory.create({ id, userId: 'capacity-user', createdAt: new Date() }),
      );

      await adapter.set(items[0]);
      await adapter.set(items[1]);
      await adapter.get('capacity-user', 'first');
      await adapter.set(items[2]);

      expect(adapter.size).toBe(2);
      expect(await adapter.get('capacity-user', 'second')).toBeNull();
      expect(await adapter.get('capacity-user', 'first')).toEqual(items[0]);
      expect(await adapter.get('capacity-user', 'third')).toEqual(items[2]);
    });

    it('expires entries using the configured TTL in milliseconds', async () => {
      adapter = new MemoryCacheAdapter({ ttlMs: 30 }, mockLogger);
      const item = itemFactory.create({
        id: 'expiring-item',
        userId: 'ttl-user',
        createdAt: new Date(),
      });

      await adapter.set(item);
      expect(await adapter.get('ttl-user', 'expiring-item')).toEqual(item);
      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(await adapter.get('ttl-user', 'expiring-item')).toBeNull();
      expect(await adapter.getMany('ttl-user', ['expiring-item'])).toEqual(new Map());
    });
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
