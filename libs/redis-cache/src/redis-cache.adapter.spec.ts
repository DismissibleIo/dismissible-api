import { mock, Mock } from 'ts-jest-mocker';
import { RedisCacheAdapter } from './redis-cache.adapter';
import { RedisClientService } from './redis-client.service';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { DismissibleItemFactory } from '@dismissible/nestjs-item';
import { RedisCacheConfig } from './redis-cache.config';
import Redis from 'ioredis';

describe('RedisCacheAdapter', () => {
  let adapter: RedisCacheAdapter;
  let mockRedisClient: Mock<RedisClientService>;
  let mockLogger: Mock<IDismissibleLogger>;
  let mockRedis: Mock<Redis>;
  let itemFactory: DismissibleItemFactory;
  let config: RedisCacheConfig;

  beforeEach(() => {
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });
    mockRedis = mock<Redis>({ failIfMockNotProvided: false });
    mockRedisClient = mock<RedisClientService>({ failIfMockNotProvided: false });
    mockRedisClient.getClient.mockReturnValue(mockRedis);

    itemFactory = new DismissibleItemFactory();
    config = {
      url: 'redis://localhost:6379',
      keyPrefix: 'test:',
      ttlMs: 3600000, // 1 hour
    };

    adapter = new RedisCacheAdapter(mockRedisClient, config, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return null when item does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await adapter.get('user-1', 'item-1');

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('test:user-1:item-1');
    });

    it('should return item when it exists', async () => {
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      const serialized = JSON.stringify({
        id: item.id,
        userId: item.userId,
        createdAt: item.createdAt.toISOString(),
        dismissedAt: null,
      });

      mockRedis.get.mockResolvedValue(serialized);

      const result = await adapter.get('user-1', 'item-1');

      expect(result).toMatchObject({
        id: item.id,
        userId: item.userId,
        createdAt: item.createdAt,
      });
      expect(result?.dismissedAt).toBeNull();
    });

    it('should handle dismissed items correctly', async () => {
      const dismissedDate = new Date('2024-01-15T12:00:00.000Z');
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        dismissedAt: dismissedDate,
      });

      const serialized = JSON.stringify({
        id: item.id,
        userId: item.userId,
        createdAt: item.createdAt.toISOString(),
        dismissedAt: dismissedDate.toISOString(),
      });

      mockRedis.get.mockResolvedValue(serialized);

      const result = await adapter.get('user-1', 'item-1');

      expect(result).toEqual(item);
      expect(result?.dismissedAt).toEqual(dismissedDate);
    });

    it('should return null when redis throws', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await adapter.get('user-1', 'item-1');

      expect(result).toBeNull();
    });

    it('should return null when deserialization fails', async () => {
      mockRedis.get.mockResolvedValue('invalid json');

      const result = await adapter.get('user-1', 'item-1');

      expect(result).toBeNull();
    });
  });

  describe('getMany', () => {
    it('should return empty map when no items exist', async () => {
      mockRedis.mget.mockResolvedValue([null, null]);

      const result = await adapter.getMany('user-1', ['item-1', 'item-2']);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(mockRedis.mget).toHaveBeenCalledWith('test:user-1:item-1', 'test:user-1:item-2');
    });

    it('should return empty map when itemIds is empty', async () => {
      const result = await adapter.getMany('user-1', []);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(mockRedis.mget).not.toHaveBeenCalled();
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

      const serialized1 = JSON.stringify({
        id: item1.id,
        userId: item1.userId,
        createdAt: item1.createdAt.toISOString(),
        dismissedAt: null,
      });
      const serialized2 = JSON.stringify({
        id: item2.id,
        userId: item2.userId,
        createdAt: item2.createdAt.toISOString(),
        dismissedAt: null,
      });

      mockRedis.mget.mockResolvedValue([serialized1, serialized2, null]);

      const result = await adapter.getMany('user-1', ['item-1', 'item-2', 'item-3']);

      expect(result.size).toBe(2);
      expect(result.get('item-1')).toMatchObject({
        id: item1.id,
        userId: item1.userId,
        createdAt: item1.createdAt,
      });
      expect(result.get('item-2')).toMatchObject({
        id: item2.id,
        userId: item2.userId,
        createdAt: item2.createdAt,
      });
      expect(result.has('item-3')).toBe(false);
    });

    it('should handle partial deserialization errors gracefully', async () => {
      const item1 = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      const serialized1 = JSON.stringify({
        id: item1.id,
        userId: item1.userId,
        createdAt: item1.createdAt.toISOString(),
        dismissedAt: null,
      });

      mockRedis.mget.mockResolvedValue([serialized1, 'invalid json']);

      const result = await adapter.getMany('user-1', ['item-1', 'item-2']);

      expect(result.size).toBe(1);
      expect(result.get('item-1')).toMatchObject({
        id: item1.id,
        userId: item1.userId,
        createdAt: item1.createdAt,
      });
    });

    it('should return empty map when redis throws', async () => {
      mockRedis.mget.mockRejectedValue(new Error('Redis connection failed'));

      const result = await adapter.getMany('user-1', ['item-1', 'item-2']);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });

  describe('set', () => {
    it('should store an item with correct TTL', async () => {
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      mockRedis.setex.mockResolvedValue('OK');

      await adapter.set(item);

      const expectedData = JSON.stringify({
        id: item.id,
        userId: item.userId,
        createdAt: item.createdAt.toISOString(),
        dismissedAt: null,
      });

      expect(mockRedis.setex).toHaveBeenCalledWith('test:user-1:item-1', 3600, expectedData);
    });

    it('should handle dismissed items correctly', async () => {
      const dismissedDate = new Date('2024-01-15T12:00:00.000Z');
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        dismissedAt: dismissedDate,
      });

      mockRedis.setex.mockResolvedValue('OK');

      await adapter.set(item);

      const expectedData = JSON.stringify({
        id: item.id,
        userId: item.userId,
        createdAt: item.createdAt.toISOString(),
        dismissedAt: dismissedDate.toISOString(),
      });

      expect(mockRedis.setex).toHaveBeenCalledWith('test:user-1:item-1', 3600, expectedData);
    });

    it('should use default TTL when not configured', async () => {
      const configWithoutTTL = {
        url: 'redis://localhost:6379',
      };
      const adapterWithDefaultTTL = new RedisCacheAdapter(
        mockRedisClient,
        configWithoutTTL,
        mockLogger,
      );

      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      mockRedis.setex.mockResolvedValue('OK');

      await adapterWithDefaultTTL.set(item);

      // Default TTL is 6 hours = 21600 seconds
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'dismissible:cache:user-1:item-1',
        21600,
        expect.any(String),
      );
    });
  });

  describe('setMany', () => {
    it('should store multiple items using pipeline', async () => {
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

      const mockPipeline = {
        setex: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'OK'],
          [null, 'OK'],
        ]),
      };
      mockRedis.pipeline.mockReturnValue(mockPipeline as unknown as ReturnType<Redis['pipeline']>);

      await adapter.setMany([item1, item2]);

      expect(mockRedis.pipeline).toHaveBeenCalled();
      expect(mockPipeline.setex).toHaveBeenCalledTimes(2);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('should handle empty array gracefully', async () => {
      await adapter.setMany([]);

      expect(mockRedis.pipeline).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete an item', async () => {
      mockRedis.del.mockResolvedValue(1);

      await adapter.delete('user-1', 'item-1');

      expect(mockRedis.del).toHaveBeenCalledWith('test:user-1:item-1');
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple items', async () => {
      mockRedis.del.mockResolvedValue(2);

      await adapter.deleteMany('user-1', ['item-1', 'item-2']);

      expect(mockRedis.del).toHaveBeenCalledWith('test:user-1:item-1', 'test:user-1:item-2');
    });

    it('should handle empty array gracefully', async () => {
      await adapter.deleteMany('user-1', []);

      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('key creation', () => {
    it('should use custom key prefix from config', () => {
      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      mockRedis.setex.mockResolvedValue('OK');
      adapter.set(item);

      expect(mockRedis.setex).toHaveBeenCalledWith('test:user-1:item-1', 3600, expect.any(String));
    });

    it('should use default key prefix when not configured', () => {
      const configWithoutPrefix = {
        url: 'redis://localhost:6379',
      };
      const adapterWithDefaultPrefix = new RedisCacheAdapter(
        mockRedisClient,
        configWithoutPrefix,
        mockLogger,
      );

      const item = itemFactory.create({
        id: 'item-1',
        userId: 'user-1',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
      });

      mockRedis.setex.mockResolvedValue('OK');
      adapterWithDefaultPrefix.set(item);

      expect(mockRedis.setex).toHaveBeenCalledWith(
        'dismissible:cache:user-1:item-1',
        21600,
        expect.any(String),
      );
    });
  });
});
