const send = jest.fn();
const destroy = jest.fn();
const waitUntilTableExists = jest.fn();
const DynamoDBClient = jest.fn().mockImplementation(() => ({ send, destroy }));

class CreateTableCommand {
  constructor(input) {
    this.input = input;
  }
}

class DescribeTableCommand {
  constructor(input) {
    this.input = input;
  }
}

class ResourceNotFoundException extends Error {}

jest.mock('@aws-sdk/client-dynamodb', () => ({
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
  waitUntilTableExists,
}));

const originalEnvironment = process.env;
process.env = {
  ...process.env,
  DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME: 'test-items',
  DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION: 'ap-southeast-2',
  DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT: 'http://dynamodb:8000',
  DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID: 'access-key',
  DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY: 'secret-key',
  DISMISSIBLE_STORAGE_DYNAMODB_AWS_SESSION_TOKEN: 'session-token',
};

const { createTable, waitForDynamoDB } = require('./dismissible-dynamodb-setup');

describe('dismissible-dynamodb-setup', () => {
  afterAll(() => {
    process.env = originalEnvironment;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('waitForDynamoDB', () => {
    it('returns true when the table already exists', async () => {
      const client = { send: jest.fn().mockResolvedValue({}) };

      await expect(waitForDynamoDB(client)).resolves.toBe(true);

      expect(client.send).toHaveBeenCalledTimes(1);
      expect(client.send).toHaveBeenCalledWith(
        expect.objectContaining({ input: { TableName: 'test-items' } }),
      );
    });

    it('returns false immediately when DynamoDB reports that the table is missing', async () => {
      const client = {
        send: jest.fn().mockRejectedValue(new ResourceNotFoundException('missing')),
      };

      await expect(waitForDynamoDB(client)).resolves.toBe(false);

      expect(client.send).toHaveBeenCalledTimes(1);
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('retries transient failures before reporting that the table exists', async () => {
      jest.useFakeTimers();
      const client = {
        send: jest
          .fn()
          .mockRejectedValueOnce(new Error('connection refused'))
          .mockResolvedValue({}),
      };

      const result = waitForDynamoDB(client);
      await jest.advanceTimersByTimeAsync(0);
      expect(client.send).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1999);
      expect(client.send).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1);

      await expect(result).resolves.toBe(true);
      expect(client.send).toHaveBeenCalledTimes(2);
      expect(console.warn).toHaveBeenCalledWith(
        'DynamoDB is not ready (attempt 1/30): connection refused',
      );
    });

    it('reports the target and last failure after exhausting readiness attempts', async () => {
      jest.useFakeTimers();
      const lastError = new Error('connection refused');
      const client = { send: jest.fn().mockRejectedValue(lastError) };

      const result = waitForDynamoDB(client);
      const rejection = expect(result).rejects.toMatchObject({
        message:
          'DynamoDB did not become ready at http://dynamodb:8000 after 30 attempts: connection refused',
        cause: lastError,
      });
      await jest.runAllTimersAsync();

      await rejection;
      expect(client.send).toHaveBeenCalledTimes(30);
      expect(console.warn).toHaveBeenCalledTimes(29);
    });
  });

  describe('createTable', () => {
    it('creates and waits for a missing table, then destroys the client', async () => {
      send
        .mockRejectedValueOnce(new ResourceNotFoundException('missing'))
        .mockResolvedValueOnce({});
      waitUntilTableExists.mockResolvedValue({ state: 'SUCCESS' });

      await createTable();

      expect(DynamoDBClient).toHaveBeenCalledWith({
        region: 'ap-southeast-2',
        endpoint: 'http://dynamodb:8000',
        credentials: {
          accessKeyId: 'access-key',
          secretAccessKey: 'secret-key',
          sessionToken: 'session-token',
        },
      });
      expect(send).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ input: { TableName: 'test-items' } }),
      );
      expect(send).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          input: {
            TableName: 'test-items',
            KeySchema: [
              { AttributeName: 'userId', KeyType: 'HASH' },
              { AttributeName: 'id', KeyType: 'RANGE' },
            ],
            AttributeDefinitions: [
              { AttributeName: 'userId', AttributeType: 'S' },
              { AttributeName: 'id', AttributeType: 'S' },
            ],
            BillingMode: 'PAY_PER_REQUEST',
          },
        }),
      );
      expect(waitUntilTableExists).toHaveBeenCalledWith(
        { client: { send, destroy }, maxWaitTime: 120 },
        { TableName: 'test-items' },
      );
      expect(destroy).toHaveBeenCalledTimes(1);
    });

    it('does not create an existing table and still destroys the client', async () => {
      send.mockResolvedValue({});

      await createTable();

      expect(send).toHaveBeenCalledTimes(1);
      expect(send.mock.calls[0][0]).toBeInstanceOf(DescribeTableCommand);
      expect(waitUntilTableExists).not.toHaveBeenCalled();
      expect(destroy).toHaveBeenCalledTimes(1);
    });

    it('destroys the client when table creation fails', async () => {
      const createError = new Error('create failed');
      send
        .mockRejectedValueOnce(new ResourceNotFoundException('missing'))
        .mockRejectedValueOnce(createError);

      await expect(createTable()).rejects.toBe(createError);

      expect(waitUntilTableExists).not.toHaveBeenCalled();
      expect(destroy).toHaveBeenCalledTimes(1);
    });
  });
});
