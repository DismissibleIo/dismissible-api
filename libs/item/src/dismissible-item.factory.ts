import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { DismissibleItemDto } from './dismissible-item';
import { IDismissibleItemFactory } from './dismissible-item.factory.interface';

/**
 * Options for creating a dismissible item.
 */
export interface ICreateDismissibleItemOptions {
  id: string;
  createdAt: Date;
  userId: string;
  dismissedAt?: Date;
}

/**
 * Factory for creating DismissibleItemDto instances.
 * Uses class-transformer to ensure proper class instantiation.
 */
@Injectable()
export class DismissibleItemFactory implements IDismissibleItemFactory {
  /**
   * Create a new DismissibleItemDto instance from the provided options.
   * Uses plainToInstance to ensure the result is a proper class instance.
   */
  create(options: ICreateDismissibleItemOptions): DismissibleItemDto {
    return plainToInstance(DismissibleItemDto, options, {
      excludeExtraneousValues: false,
      enableImplicitConversion: true,
    });
  }

  /**
   * Create a clone of an existing DismissibleItemDto.
   */
  clone(item: DismissibleItemDto): DismissibleItemDto {
    return this.create({
      id: item.id,
      createdAt: item.createdAt,
      userId: item.userId,
      dismissedAt: item.dismissedAt,
    });
  }

  /**
   * Create a dismissed version of an existing item.
   */
  createDismissed(item: DismissibleItemDto, dismissedAt: Date): DismissibleItemDto {
    return this.create({
      id: item.id,
      createdAt: item.createdAt,
      userId: item.userId,
      dismissedAt,
    });
  }

  /**
   * Create a restored (non-dismissed) version of an existing item.
   * Removes the dismissedAt property.
   */
  createRestored(item: DismissibleItemDto): DismissibleItemDto {
    return this.create({
      id: item.id,
      createdAt: item.createdAt,
      userId: item.userId,
      dismissedAt: undefined,
    });
  }
}
