import { NullCacheAdapter } from './null-cache.adapter';
import { DismissibleItemFactory } from '@dismissible/nestjs-item';

describe('NullCacheAdapter', () => {
  let adapter: NullCacheAdapter;
  let itemFactory: DismissibleItemFactory;

  beforeEach(() => {
    adapter = new NullCacheAdapter();
    itemFactory = new DismissibleItemFactory();
  });

  describe('get', () => {
    it('should return null', async () => {
      const result = await adapter.get('user1', 'item1');
      expect(result).toBeNull();
    });
  });

  describe('getMany', () => {
    it('should return empty map', async () => {
      const result = await adapter.getMany('user1', ['item1', 'item2']);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });

  describe('set', () => {
    it('should not throw', async () => {
      const item = itemFactory.create({
        id: 'item1',
        userId: 'user1',
        createdAt: new Date(),
      });
      await expect(adapter.set(item)).resolves.toBeUndefined();
    });
  });

  describe('setMany', () => {
    it('should not throw', async () => {
      const items = [
        itemFactory.create({
          id: 'item1',
          userId: 'user1',
          createdAt: new Date(),
        }),
        itemFactory.create({
          id: 'item2',
          userId: 'user1',
          createdAt: new Date(),
        }),
      ];
      await expect(adapter.setMany(items)).resolves.toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should not throw', async () => {
      await expect(adapter.delete('user1', 'item1')).resolves.toBeUndefined();
    });
  });

  describe('deleteMany', () => {
    it('should not throw', async () => {
      await expect(adapter.deleteMany('user1', ['item1', 'item2'])).resolves.toBeUndefined();
    });
  });
});
