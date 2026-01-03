import { mock, Mock } from 'ts-jest-mocker';
import { DynamoDBClientService } from './dynamodb-client.service';
import { DynamoDBStorageConfig } from './dynamodb-storage.config';
import { IDismissibleLogger } from '@dismissible/nestjs-logger';

describe('DynamoDBClientService', () => {
  let mockLogger: Mock<IDismissibleLogger>;
  let mockConfig: DynamoDBStorageConfig;

  beforeEach(() => {
    mockLogger = mock<IDismissibleLogger>({ failIfMockNotProvided: false });
    mockConfig = {
      tableName: 'items',
      region: 'us-east-1',
      endpoint: 'http://localhost:4566',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
      sessionToken: 'test-token',
    };
  });

  describe('constructor', () => {
    it('should initialize with provided configuration without throwing', () => {
      expect(() => new DynamoDBClientService(mockConfig, mockLogger)).not.toThrow();
    });

    it('should handle configuration without optional fields', () => {
      const minimalConfig = {
        tableName: 'test-table',
      } as DynamoDBStorageConfig;

      expect(() => new DynamoDBClientService(minimalConfig, mockLogger)).not.toThrow();
    });
  });

  describe('onModuleInit', () => {
    it('should log debug message with configuration', async () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      await service.onModuleInit();

      expect(mockLogger.debug).toHaveBeenCalledWith('Initializing DynamoDB client', {
        region: 'us-east-1',
        tableName: 'items',
        endpoint: 'http://localhost:4566',
      });
    });

    it('should log debug message with minimal configuration', async () => {
      const minimalConfig = {
        tableName: 'test-table',
      } as DynamoDBStorageConfig;

      const service = new DynamoDBClientService(minimalConfig, mockLogger);

      await service.onModuleInit();

      expect(mockLogger.debug).toHaveBeenCalledWith('Initializing DynamoDB client', {
        region: undefined,
        tableName: 'test-table',
        endpoint: undefined,
      });
    });
  });

  describe('onModuleDestroy', () => {
    it('should not throw any errors', async () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });

  describe('get', () => {
    it('should return item when found', async () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);
      const mockItem = { userId: 'user-123', id: 'item-456', data: 'test' };

      const sendMock = jest.fn().mockResolvedValue({ Item: mockItem });
      (service as any).documentClient = { send: sendMock };

      const result = await service.get('user-123', 'item-456');

      expect(result).toEqual(mockItem);
    });

    it('should return null when item not found', async () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      const sendMock = jest.fn().mockResolvedValue({ Item: undefined });
      (service as any).documentClient = { send: sendMock };

      const result = await service.get('user-123', 'item-456');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create item without throwing', async () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      const sendMock = jest.fn().mockResolvedValue({});
      (service as any).documentClient = { send: sendMock };

      await expect(service.create({ userId: 'user-123', id: 'item-456' })).resolves.not.toThrow();
    });
  });

  describe('update', () => {
    it('should update item without throwing', async () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      const sendMock = jest.fn().mockResolvedValue({});
      (service as any).documentClient = { send: sendMock };

      await expect(
        service.update('user-123', 'item-456', '2024-01-15T12:00:00.000Z'),
      ).resolves.not.toThrow();
    });

    it('should update with null dismissedAt', async () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      const sendMock = jest.fn().mockResolvedValue({});
      (service as any).documentClient = { send: sendMock };

      await expect(service.update('user-123', 'item-456', null)).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete item without throwing', async () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      const sendMock = jest.fn().mockResolvedValue({});
      (service as any).documentClient = { send: sendMock };

      await expect(service.delete('user-123', 'item-456')).resolves.not.toThrow();

      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'items',
            Key: { userId: 'user-123', id: 'item-456' },
          }),
        }),
      );
    });
  });

  describe('deleteAll', () => {
    it('should delete all items without throwing', async () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      const sendMock = jest
        .fn()
        .mockResolvedValueOnce({
          Items: [
            { userId: 'user-1', id: 'item-1' },
            { userId: 'user-2', id: 'item-2' },
          ],
          LastEvaluatedKey: undefined,
        })
        .mockResolvedValue({});
      (service as any).documentClient = { send: sendMock };

      await expect(service.deleteAll()).resolves.not.toThrow();
    });

    it('should handle pagination with multiple scan results', async () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      const sendMock = jest
        .fn()
        .mockResolvedValueOnce({
          Items: [{ userId: 'user-1', id: 'item-1' }],
          LastEvaluatedKey: { userId: 'user-1', id: 'item-1' },
        })
        .mockResolvedValueOnce({
          Items: [{ userId: 'user-2', id: 'item-2' }],
          LastEvaluatedKey: undefined,
        })
        .mockResolvedValue({});
      (service as any).documentClient = { send: sendMock };

      await expect(service.deleteAll()).resolves.not.toThrow();

      expect(sendMock).toHaveBeenCalledTimes(3);
    });

    it('should handle empty table', async () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      const sendMock = jest.fn().mockResolvedValue({
        Items: [],
        LastEvaluatedKey: undefined,
      });
      (service as any).documentClient = { send: sendMock };

      await expect(service.deleteAll()).resolves.not.toThrow();
    });

    it('should handle batch deletion with more than 25 items', async () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      // Create 30 items to test chunking
      const items = Array.from({ length: 30 }, (_, i) => ({
        userId: `user-${i}`,
        id: `item-${i}`,
      }));

      const sendMock = jest
        .fn()
        .mockResolvedValueOnce({
          Items: items,
          LastEvaluatedKey: undefined,
        })
        .mockResolvedValue({});
      (service as any).documentClient = { send: sendMock };

      await expect(service.deleteAll()).resolves.not.toThrow();

      // Should have been called twice: once for scan, twice for batch writes (30 items in chunks of 25)
      expect(sendMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('chunkArray', () => {
    it('should split array into chunks of specified size', () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      const result = (service as any).chunkArray([1, 2, 3, 4, 5], 2);

      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should return empty array when input is empty', () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      const result = (service as any).chunkArray([], 3);

      expect(result).toEqual([]);
    });

    it('should handle chunk size larger than array length', () => {
      const service = new DynamoDBClientService(mockConfig, mockLogger);

      const result = (service as any).chunkArray([1, 2, 3], 10);

      expect(result).toEqual([[1, 2, 3]]);
    });
  });
});
