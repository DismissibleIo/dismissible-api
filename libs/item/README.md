<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="../../docs/images/dismissible_logo.png" width="120" alt="Dismissible" /></a>
</p>

<p align="center">Never Show The Same Thing Twice!</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-item" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/nestjs-item.svg" alt="NPM Version" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@dismissible/nestjs-item.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-item" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/nestjs-item.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-api/release.yml"></a>
  <a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
</p>

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

# @dismissible/nestjs-item

Core data models and factory for dismissible items in NestJS applications.

> **Part of the Dismissible API** - This library is part of the [Dismissible API](https://dismissible.io) ecosystem. Visit [dismissible.io](https://dismissible.io) for more information and documentation.

## Overview

This library provides the foundational data structures for the Dismissible system:

- `DismissibleItemDto` - The core data transfer object representing a dismissible item
- `DismissibleItemFactory` - Factory for creating and manipulating dismissible items

## Installation

```bash
npm install @dismissible/nestjs-item
```

## Getting Started

### Basic Usage

The `DismissibleItemDto` class represents a dismissible item with the following properties:

- `id` - Unique identifier for the item
- `userId` - User identifier who owns the item
- `createdAt` - Timestamp when the item was created
- `dismissedAt` - Optional timestamp when the item was dismissed

```typescript
import { DismissibleItemDto } from '@dismissible/nestjs-item';

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
import { DismissibleItemModule, DismissibleItemFactory } from '@dismissible/nestjs-item';

@Module({
  imports: [DismissibleItemModule],
})
export class AppModule {}

// In your service
import { Injectable } from '@nestjs/common';
import { DismissibleItemFactory, DismissibleItemDto } from '@dismissible/nestjs-item';

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

- `@dismissible/nestjs-core` - Main dismissible service and module
- `@dismissible/nestjs-storage` - Storage interface and adapters
- `@dismissible/nestjs-postgres-storage` - PostgreSQL storage adapter

## License

MIT
