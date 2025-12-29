import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DynamoDBStorageConfig } from './dynamodb-storage.config';

describe('DynamoDBStorageConfig', () => {
  describe('validation', () => {
    it('should pass with valid required fields', async () => {
      const config = plainToInstance(DynamoDBStorageConfig, {
        tableName: 'dismissible-items',
      });

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should pass with all optional fields', async () => {
      const config = plainToInstance(DynamoDBStorageConfig, {
        tableName: 'dismissible-items',
        region: 'us-east-1',
        endpoint: 'http://localhost:4566',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        sessionToken: 'test-token',
      });

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });

    it('should fail when tableName is missing', async () => {
      const config = plainToInstance(DynamoDBStorageConfig, {
        region: 'us-east-1',
      });

      const errors = await validate(config);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('tableName');
    });

    it('should fail when tableName is not a string', async () => {
      const config = plainToInstance(DynamoDBStorageConfig, {
        tableName: 12345,
      });

      const errors = await validate(config);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('tableName');
    });

    it('should allow optional fields to be undefined', async () => {
      const config = plainToInstance(DynamoDBStorageConfig, {
        tableName: 'dismissible-items',
        region: undefined,
        endpoint: undefined,
        accessKeyId: undefined,
        secretAccessKey: undefined,
        sessionToken: undefined,
      });

      const errors = await validate(config);
      expect(errors).toHaveLength(0);
    });
  });

  describe('property assignments', () => {
    it('should correctly read all properties', () => {
      const config = plainToInstance(DynamoDBStorageConfig, {
        tableName: 'test-table',
        region: 'us-west-2',
        endpoint: 'http://localhost:4566',
        accessKeyId: 'key',
        secretAccessKey: 'secret',
        sessionToken: 'token',
      });

      expect(config.tableName).toBe('test-table');
      expect(config.region).toBe('us-west-2');
      expect(config.endpoint).toBe('http://localhost:4566');
      expect(config.accessKeyId).toBe('key');
      expect(config.secretAccessKey).toBe('secret');
      expect(config.sessionToken).toBe('token');
    });
  });
});
