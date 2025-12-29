import { Injectable, Inject } from '@nestjs/common';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { IDismissibleStorage } from '@dismissible/nestjs-storage';
import { DismissibleItemDto, DismissibleItemFactory } from '@dismissible/nestjs-dismissible-item';
import { DynamoDBClientService } from './dynamodb-client.service';

@Injectable()
export class DynamoDBStorageAdapter implements IDismissibleStorage {
  constructor(
    private readonly dynamoDB: DynamoDBClientService,
    @Inject(DISMISSIBLE_LOGGER) private readonly logger: IDismissibleLogger,
    private readonly itemFactory: DismissibleItemFactory,
  ) {}

  async get(userId: string, itemId: string): Promise<DismissibleItemDto | null> {
    this.logger.debug('DynamoDB storage get', { userId, itemId });

    const item = await this.dynamoDB.get(userId, itemId);

    if (!item) {
      this.logger.debug('DynamoDB storage miss', { userId, itemId });
      return null;
    }

    this.logger.debug('DynamoDB storage hit', { userId, itemId });
    return this.mapToDto(item);
  }

  async create(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    this.logger.debug('DynamoDB storage create', { userId: item.userId, itemId: item.id });

    await this.dynamoDB.create({
      userId: item.userId,
      id: item.id,
      createdAt: item.createdAt.toISOString(),
      dismissedAt: item.dismissedAt?.toISOString() ?? null,
    });

    return item;
  }

  async update(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    this.logger.debug('DynamoDB storage update', { userId: item.userId, itemId: item.id });

    await this.dynamoDB.update(item.userId, item.id, item.dismissedAt?.toISOString() ?? null);

    return item;
  }

  private mapToDto(item: Record<string, any>): DismissibleItemDto {
    return this.itemFactory.create({
      id: item.id,
      userId: item.userId,
      createdAt: new Date(item.createdAt),
      dismissedAt: item.dismissedAt ? new Date(item.dismissedAt) : undefined,
    });
  }
}
