import { mock, Mock } from 'ts-jest-mocker';
import { DynamoDBStorageAdapter } from './dynamodb-storage.adapter';
import { DynamoDBClientService } from './dynamodb-client.service';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { DismissibleItemDto, DismissibleItemFactory } from '@dismissible/nestjs-item';

describe('DynamoDBStorageAdapter', () => {
  let adapter: DynamoDBStorageAdapter;
  let mockDynamoDBClientService: Mock<DynamoDBClientService>;
  let mockLogger: Mock<IDismissibleLogger>;
  let mockItemFactory: DismissibleItemFactory;

  beforeEach(() => {
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });

    mockItemFactory = new DismissibleItemFactory();

    mockDynamoDBClientService = mock<DynamoDBClientService>({ failIfMockNotProvided: false });

    adapter = new DynamoDBStorageAdapter(mockDynamoDBClientService, mockLogger, mockItemFactory);
  });

  describe('get', () => {
    it('should return null when item is not found', async () => {
      mockDynamoDBClientService.get.mockResolvedValue(null);

      const result = await adapter.get('user-123', 'item-456');

      expect(result).toBeNull();
      expect(mockDynamoDBClientService.get).toHaveBeenCalledWith('user-123', 'item-456');
      expect(mockLogger.debug).toHaveBeenCalledWith('DynamoDB storage miss', {
        userId: 'user-123',
        itemId: 'item-456',
      });
    });

    it('should return the item when found', async () => {
      const dbItem = {
        id: 'item-456',
        userId: 'user-123',
        createdAt: '2024-01-15T10:30:00.000Z',
        dismissedAt: null,
      };
      mockDynamoDBClientService.get.mockResolvedValue(dbItem);

      const result = await adapter.get('user-123', 'item-456');

      expect(result).toEqual({
        id: 'item-456',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        dismissedAt: undefined,
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('DynamoDB storage hit', {
        userId: 'user-123',
        itemId: 'item-456',
      });
    });
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const item: DismissibleItemDto = {
        id: 'item-456',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
      };
      mockDynamoDBClientService.create.mockResolvedValue();

      const result = await adapter.create(item);

      expect(result).toEqual(item);
      expect(mockDynamoDBClientService.create).toHaveBeenCalledWith({
        userId: 'user-123',
        id: 'item-456',
        createdAt: '2024-01-15T10:30:00.000Z',
        dismissedAt: null,
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('DynamoDB storage create', {
        userId: 'user-123',
        itemId: 'item-456',
      });
    });
  });

  describe('update', () => {
    it('should update an existing item', async () => {
      const item: DismissibleItemDto = {
        id: 'item-456',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        dismissedAt: new Date('2024-01-15T12:00:00.000Z'),
      };
      mockDynamoDBClientService.update.mockResolvedValue();

      const result = await adapter.update(item);

      expect(result).toEqual(item);
      expect(mockDynamoDBClientService.update).toHaveBeenCalledWith(
        'user-123',
        'item-456',
        '2024-01-15T12:00:00.000Z',
      );
      expect(mockLogger.debug).toHaveBeenCalledWith('DynamoDB storage update', {
        userId: 'user-123',
        itemId: 'item-456',
      });
    });

    it('should update an item with undefined dismissedAt', async () => {
      const item: DismissibleItemDto = {
        id: 'item-456',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
      };
      mockDynamoDBClientService.update.mockResolvedValue();

      const result = await adapter.update(item);

      expect(result).toEqual(item);
      expect(mockDynamoDBClientService.update).toHaveBeenCalledWith('user-123', 'item-456', null);
      expect(mockLogger.debug).toHaveBeenCalledWith('DynamoDB storage update', {
        userId: 'user-123',
        itemId: 'item-456',
      });
    });
  });

  describe('delete', () => {
    it('should delete an item', async () => {
      mockDynamoDBClientService.delete.mockResolvedValue();

      await adapter.delete('user-123', 'item-456');

      expect(mockDynamoDBClientService.delete).toHaveBeenCalledWith('user-123', 'item-456');
      expect(mockLogger.debug).toHaveBeenCalledWith('DynamoDB storage delete', {
        userId: 'user-123',
        itemId: 'item-456',
      });
    });
  });

  describe('deleteAll', () => {
    it('should delete all items', async () => {
      mockDynamoDBClientService.deleteAll.mockResolvedValue();

      await adapter.deleteAll();

      expect(mockDynamoDBClientService.deleteAll).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('DynamoDB storage deleteAll');
    });
  });

  describe('getMany', () => {
    it('should return empty map when no items found', async () => {
      mockDynamoDBClientService.getMany.mockResolvedValue([]);

      const result = await adapter.getMany('user-123', ['item-1', 'item-2']);

      expect(result.size).toBe(0);
      expect(mockDynamoDBClientService.getMany).toHaveBeenCalledWith('user-123', [
        'item-1',
        'item-2',
      ]);
    });

    it('should return map with found items', async () => {
      const dbItems = [
        {
          id: 'item-1',
          userId: 'user-123',
          createdAt: '2024-01-15T10:30:00.000Z',
          dismissedAt: null,
        },
        {
          id: 'item-2',
          userId: 'user-123',
          createdAt: '2024-01-15T10:30:00.000Z',
          dismissedAt: '2024-01-15T12:00:00.000Z',
        },
      ];
      mockDynamoDBClientService.getMany.mockResolvedValue(dbItems);

      const result = await adapter.getMany('user-123', ['item-1', 'item-2', 'item-3']);

      expect(result.size).toBe(2);
      expect(result.get('item-1')).toEqual({
        id: 'item-1',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        dismissedAt: undefined,
      });
      expect(result.get('item-2')).toEqual({
        id: 'item-2',
        userId: 'user-123',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
        dismissedAt: new Date('2024-01-15T12:00:00.000Z'),
      });
      expect(result.has('item-3')).toBe(false);
    });
  });

  describe('createMany', () => {
    it('should create multiple items', async () => {
      const items: DismissibleItemDto[] = [
        {
          id: 'item-1',
          userId: 'user-123',
          createdAt: new Date('2024-01-15T10:30:00.000Z'),
        },
        {
          id: 'item-2',
          userId: 'user-123',
          createdAt: new Date('2024-01-15T10:30:00.000Z'),
        },
      ];
      mockDynamoDBClientService.createMany.mockResolvedValue();

      const result = await adapter.createMany(items);

      expect(result).toEqual(items);
      expect(mockDynamoDBClientService.createMany).toHaveBeenCalledWith([
        {
          id: 'item-1',
          userId: 'user-123',
          createdAt: '2024-01-15T10:30:00.000Z',
          dismissedAt: null,
        },
        {
          id: 'item-2',
          userId: 'user-123',
          createdAt: '2024-01-15T10:30:00.000Z',
          dismissedAt: null,
        },
      ]);
    });

    it('should return empty array when creating empty array', async () => {
      const result = await adapter.createMany([]);

      expect(result).toEqual([]);
      expect(mockDynamoDBClientService.createMany).not.toHaveBeenCalled();
    });
  });
});
