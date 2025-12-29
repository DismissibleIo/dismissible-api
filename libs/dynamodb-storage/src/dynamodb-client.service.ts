import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  DynamoDBStorageConfig,
  DISMISSIBLE_DYNAMODB_STORAGE_CONFIG,
} from './dynamodb-storage.config';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';

@Injectable()
export class DynamoDBClientService implements OnModuleInit, OnModuleDestroy {
  private readonly client: DynamoDBClient;
  private readonly documentClient: DynamoDBDocumentClient;

  constructor(
    @Inject(DISMISSIBLE_DYNAMODB_STORAGE_CONFIG) private readonly config: DynamoDBStorageConfig,
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

  async create(item: Record<string, any>): Promise<void> {
    await this.documentClient.send(
      new PutCommand({
        TableName: this.config.tableName,
        Item: item,
      }),
    );
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
}
