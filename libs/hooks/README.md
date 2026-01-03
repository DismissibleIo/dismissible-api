<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="../../docs/images/dismissible_logo.png" width="120" alt="Dismissible" /></a>
</p>

<p align="center">Never Show The Same Thing Twice!</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-hooks" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/nestjs-hooks.svg" alt="NPM Version" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@dismissible/nestjs-hooks.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-hooks" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/nestjs-hooks.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-api/release.yml"></a>
  <a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
</p>

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

# @dismissible/nestjs-hooks

Lifecycle hooks interfaces for Dismissible applications.

> **Part of the Dismissible API** - This library is part of the [Dismissible API](https://dismissible.io) ecosystem. Visit [dismissible.io](https://dismissible.io) for more information and documentation.

## Overview

This library provides the core interfaces for implementing lifecycle hooks in the Dismissible system:

- `IDismissibleLifecycleHook` - Interface for lifecycle hooks
- `IHookResult` - Result returned by pre-hooks
- `IHookMutations` - Mutations that can be applied by pre-hooks
- `IRequestContext` - Request context passed through dismissible operations
- `DISMISSIBLE_HOOKS` - Injection token for lifecycle hooks

## Installation

```bash
npm install @dismissible/nestjs-hooks
```

## Getting Started

### Basic Usage

Implement the `IDismissibleLifecycleHook` interface to create custom lifecycle hooks:

```typescript
import { Injectable } from '@nestjs/common';
import { IDismissibleLifecycleHook, IHookResult, IRequestContext } from '@dismissible/nestjs-hooks';

@Injectable()
export class MyLifecycleHook implements IDismissibleLifecycleHook {
  readonly priority = 0;

  async onBeforeRequest(
    itemId: string,
    userId: string,
    context?: IRequestContext,
  ): Promise<IHookResult> {
    // Your logic here
    return { proceed: true };
  }
}
```

## API Reference

### IDismissibleLifecycleHook

Interface for lifecycle hooks that can intercept dismissible operations.

#### Methods

- `onBeforeRequest(itemId, userId, context?)` - Called at the start of any operation
- `onAfterRequest(itemId, item, userId, context?)` - Called at the end of any operation
- `onBeforeGet(itemId, item, userId, context?)` - Called before returning an existing item
- `onAfterGet(itemId, item, userId, context?)` - Called after returning an existing item
- `onBeforeCreate(itemId, userId, context?)` - Called before creating a new item
- `onAfterCreate(itemId, item, userId, context?)` - Called after creating a new item
- `onBeforeDismiss(itemId, userId, context?)` - Called before dismissing an item
- `onAfterDismiss(itemId, item, userId, context?)` - Called after dismissing an item
- `onBeforeRestore(itemId, userId, context?)` - Called before restoring an item
- `onAfterRestore(itemId, item, userId, context?)` - Called after restoring an item

### IHookResult

Result returned by pre-hooks.

```typescript
interface IHookResult {
  proceed: boolean;
  reason?: string;
  mutations?: IHookMutations;
}
```

### IHookMutations

Mutations that can be applied by pre-hooks.

```typescript
interface IHookMutations {
  id?: string;
  userId?: string;
  context?: Partial<IRequestContext>;
}
```

### IRequestContext

Request context passed through dismissible operations.

```typescript
interface IRequestContext {
  requestId: string;
  authorizationHeader?: string;
}
```

## Related Packages

This library is typically used alongside other Dismissible packages:

- `@dismissible/nestjs-core` - Main dismissible service and module
- `@dismissible/nestjs-item` - Core data models
- `@dismissible/nestjs-jwt-auth-hook` - JWT authentication hook implementation

## License

MIT
