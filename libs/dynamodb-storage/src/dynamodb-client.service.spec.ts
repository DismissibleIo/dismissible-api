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
      tableName: 'dismissible-items',
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
        tableName: 'dismissible-items',
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
});
