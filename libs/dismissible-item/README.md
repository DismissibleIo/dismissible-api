# @dismissible/nestjs-dismissible-item

Core data models and factory for dismissible items in NestJS applications.

> **Part of the Dismissible API** - This library is part of the [Dismissible API](https://dismissible.io) ecosystem. Visit [dismissible.io](https://dismissible.io) for more information and documentation.

## Overview

This library provides the foundational data structures for the Dismissible system:

- `DismissibleItemDto` - The core data transfer object representing a dismissible item
- `DismissibleItemFactory` - Factory for creating and manipulating dismissible items

## Installation

```bash
npm install @dismissible/nestjs-dismissible-item
```

## Getting Started

### Basic Usage

The `DismissibleItemDto` class represents a dismissible item with the following properties:

- `id` - Unique identifier for the item
- `userId` - User identifier who owns the item
- `createdAt` - Timestamp when the item was created
- `dismissedAt` - Optional timestamp when the item was dismissed

```typescript
import { DismissibleItemDto } from '@dismissible/nestjs-dismissible-item';

const item: DismissibleItemDto = {
  id: 'welcome-banner',
  userId: 'user-123',
  createdAt: new Date(),
};
```

### Using the Factory

The `DismissibleItemFactory` provides methods for creating and manipulating items:

```typescript
import { Module } from '@nestjs/common';
import {
  DismissibleItemModule,
  DismissibleItemFactory,
} from '@dismissible/nestjs-dismissible-item';

@Module({
  imports: [DismissibleItemModule],
})
export class AppModule {}

// In your service
import { Injectable } from '@nestjs/common';
import { DismissibleItemFactory, DismissibleItemDto } from '@dismissible/nestjs-dismissible-item';

@Injectable()
export class MyService {
  constructor(private readonly itemFactory: DismissibleItemFactory) {}

  createItem(): DismissibleItemDto {
    return this.itemFactory.create({
      id: 'welcome-banner',
      userId: 'user-123',
      createdAt: new Date(),
    });
  }

  dismissItem(item: DismissibleItemDto): DismissibleItemDto {
    return this.itemFactory.createDismissed(item, new Date());
  }

  restoreItem(item: DismissibleItemDto): DismissibleItemDto {
    return this.itemFactory.createRestored(item);
  }
}
```

## API Reference

### DismissibleItemDto

The main data transfer object for dismissible items.

```typescript
class DismissibleItemDto {
  id: string;
  userId: string;
  createdAt: Date;
  dismissedAt?: Date;
}
```

### DismissibleItemFactory

Factory for creating and manipulating dismissible items.

#### Methods

- `create(options)` - Create a new item from options
- `clone(item)` - Create a clone of an existing item
- `createDismissed(item, dismissedAt)` - Create a dismissed version of an item
- `createRestored(item)` - Create a restored (non-dismissed) version of an item

## Related Packages

This library is typically used alongside other Dismissible packages:

- `@dismissible/nestjs-dismissible` - Main dismissible service and module
- `@dismissible/nestjs-storage` - Storage interface and adapters
- `@dismissible/nestjs-postgres-storage` - PostgreSQL storage adapter

## License

MIT
