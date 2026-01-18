import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  BatchWriteCommand,
  BatchGetCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  DynamoDBStorageConfig,
  DISMISSIBLE_STORAGE_DYNAMODB_CONFIG,
} from './dynamodb-storage.config';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';

@Injectable()
export class DynamoDBClientService implements OnModuleInit, OnModuleDestroy {
  private readonly client: DynamoDBClient;
  private readonly documentClient: DynamoDBDocumentClient;

  constructor(
    @Inject(DISMISSIBLE_STORAGE_DYNAMODB_CONFIG) private readonly config: DynamoDBStorageConfig,
    @Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger,
  ) {
    this.client = new DynamoDBClient({
      region: this.config.region ?? 'us-east-1',
      endpoint: this.config.endpoint,
      credentials:
        this.config.accessKeyId && this.config.secretAccessKey
          ? {
              accessKeyId: this.config.accessKeyId,
              secretAccessKey: this.config.secretAccessKey,
              sessionToken: this.config.sessionToken,
            }
          : undefined,
    });

    this.documentClient = DynamoDBDocumentClient.from(this.client, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.debug('Initializing DynamoDB client', {
      region: this.config.region,
      tableName: this.config.tableName,
      endpoint: this.config.endpoint,
    });
  }

  async onModuleDestroy(): Promise<void> {
    // DynamoDB client doesn't require explicit cleanup
  }

  async get(userId: string, itemId: string): Promise<Record<string, any> | null> {
    const response = await this.documentClient.send(
      new GetCommand({
        TableName: this.config.tableName,
        Key: { userId, id: itemId },
      }),
    );

    return response.Item ?? null;
  }

  async getMany(userId: string, itemIds: string[]): Promise<Record<string, any>[]> {
    if (itemIds.length === 0) {
      return [];
    }

    const results: Record<string, any>[] = [];
    const batches = this.chunkArray(itemIds, 100); // DynamoDB BatchGetItem limit is 100

    for (const batch of batches) {
      const keys = batch.map((itemId) => ({ userId, id: itemId }));

      const response = await this.documentClient.send(
        new BatchGetCommand({
          RequestItems: {
            [this.config.tableName]: {
              Keys: keys,
            },
          },
        }),
      );

      const items = response.Responses?.[this.config.tableName] ?? [];
      results.push(...items);
    }

    return results;
  }

  async create(item: Record<string, any>): Promise<void> {
    await this.documentClient.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: item,
      }),
    );
  }

  async createMany(items: Record<string, any>[]): Promise<void> {
    if (items.length === 0) {
      return;
    }

    const batches = this.chunkArray(items, 25); // DynamoDB BatchWriteItem limit is 25

    for (const batch of batches) {
      const putRequests = batch.map((item) => ({
        PutRequest: {
          Item: item,
        },
      }));

      await this.documentClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [this.config.tableName]: putRequests,
          },
        }),
      );
    }
  }

  async update(userId: string, itemId: string, dismissedAt: string | null): Promise<void> {
    await this.documentClient.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: { userId, id: itemId },
        UpdateExpression: 'SET dismissedAt = :dismissedAt',
        ExpressionAttributeValues: {
          ':dismissedAt': dismissedAt,
        },
      }),
    );
  }

  async delete(userId: string, itemId: string): Promise<void> {
    await this.documentClient.send(
      new DeleteCommand({
        TableName: this.config.tableName,
        Key: { userId, id: itemId },
      }),
    );
  }

  async deleteAll(): Promise<void> {
    let lastEvaluatedKey: Record<string, any> | undefined;
    do {
      const response = await this.documentClient.send(
        new ScanCommand({
          TableName: this.config.tableName,
          ExclusiveStartKey: lastEvaluatedKey,
        }),
      );

      if (response.Items && response.Items.length > 0) {
        const batches = this.chunkArray(response.Items, 25);
        for (const batch of batches) {
          await this.batchDeleteItems(batch);
        }
      }

      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);
  }

  private async batchDeleteItems(items: Record<string, any>[]): Promise<void> {
    const deleteRequests = items.map((item) => ({
      DeleteRequest: {
        Key: { userId: item.userId, id: item.id },
      },
    }));

    await this.documentClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [this.config.tableName]: deleteRequests,
        },
      }),
    );
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
