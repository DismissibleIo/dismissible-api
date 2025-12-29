import { mock, Mock } from 'ts-jest-mocker';
import { DynamoDBStorageAdapter } from './dynamodb-storage.adapter';
import { DynamoDBClientService } from './dynamodb-client.service';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';
import { DismissibleItemDto, DismissibleItemFactory } from '@dismissible/nestjs-dismissible-item';

describe('DynamoDBStorageAdapter', () => {
  let adapter: DynamoDBStorageAdapter;
  let mockDynamoDBClientService: Mock<DynamoDBClientService>;
  let mockLogger: jest.Mocked<IDismissibleLogger>;
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
});
