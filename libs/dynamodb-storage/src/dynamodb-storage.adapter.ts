import { Injectable, Inject } from '@nestjs/common';
import { DISMISSIBLE_LOGGER, IDismissibleLogger } from '@dismissible/nestjs-logger';
import { IDismissibleStorage } from '@dismissible/nestjs-storage';
import { DismissibleItemDto, DismissibleItemFactory } from '@dismissible/nestjs-item';
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

  async getMany(userId: string, itemIds: string[]): Promise<Map<string, DismissibleItemDto>> {
    this.logger.debug('DynamoDB storage getMany', { userId, itemCount: itemIds.length });

    const items = await this.dynamoDB.getMany(userId, itemIds);

    const result = new Map<string, DismissibleItemDto>();
    for (const item of items) {
      result.set(item.id, this.mapToDto(item));
    }

    this.logger.debug('DynamoDB storage getMany complete', {
      userId,
      requested: itemIds.length,
      found: result.size,
    });

    return result;
  }

  async create(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    this.logger.debug('DynamoDB storage create', { userId: item.userId, itemId: item.id });

    const created = await this.dynamoDB.create({
      userId: item.userId,
      id: item.id,
      createdAt: item.createdAt.toISOString(),
      dismissedAt: item.dismissedAt?.toISOString() ?? null,
    });

    if (created) {
      return item;
    }

    // A concurrent request created the item first, so the stored item wins
    return (await this.get(item.userId, item.id)) ?? item;
  }

  async createMany(items: DismissibleItemDto[]): Promise<DismissibleItemDto[]> {
    this.logger.debug('DynamoDB storage createMany', { itemCount: items.length });

    if (items.length === 0) {
      return [];
    }

    // BatchWriteItem cannot be conditional and would overwrite items created concurrently
    const createdItems = await Promise.all(items.map((item) => this.create(item)));

    this.logger.debug('DynamoDB storage createMany complete', { created: items.length });

    return createdItems;
  }

  async update(item: DismissibleItemDto): Promise<DismissibleItemDto> {
    this.logger.debug('DynamoDB storage update', { userId: item.userId, itemId: item.id });

    await this.dynamoDB.update(item.userId, item.id, item.dismissedAt?.toISOString() ?? null);

    return item;
  }

  async delete(userId: string, itemId: string): Promise<void> {
    this.logger.debug('DynamoDB storage delete', { userId, itemId });
    await this.dynamoDB.delete(userId, itemId);
  }

  async deleteAll(): Promise<void> {
    this.logger.debug('DynamoDB storage deleteAll');
    await this.dynamoDB.deleteAll();
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
