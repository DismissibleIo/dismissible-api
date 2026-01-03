<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="../../docs/images/dismissible_logo.png" width="120" alt="Dismissible" /></a>
</p>

<p align="center">Never Show The Same Thing Twice!</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-request" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/nestjs-request.svg" alt="NPM Version" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@dismissible/nestjs-request.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-request" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/nestjs-request.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-api/release.yml"></a>
  <a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
</p>

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

# @dismissible/nestjs-request

Request context decorator for Dismissible applications.

> **Part of the Dismissible API** - This library is part of the [Dismissible API](https://dismissible.io) ecosystem. Visit [dismissible.io](https://dismissible.io) for more information and documentation.

## Overview

This library provides a NestJS parameter decorator for extracting request context from HTTP requests:

- `RequestContext` - Parameter decorator that extracts request context from the current HTTP request

## Installation

```bash
npm install @dismissible/nestjs-request
```

## Getting Started

### Basic Usage

Use the `RequestContext` decorator in your controllers to extract request context:

```typescript
import { Controller, Get } from '@nestjs/common';
import { RequestContext, IRequestContext } from '@dismissible/nestjs-request';

@Controller('items')
export class ItemsController {
  @Get()
  async getItems(@RequestContext() context: IRequestContext) {
    // Use context.requestId, context.headers, etc.
    return { requestId: context.requestId };
  }
}
```

## API Reference

### RequestContext

A NestJS parameter decorator that extracts request context from the current HTTP request.

The decorator returns an `IRequestContext` object containing:

- `requestId` - Unique request identifier (from `x-request-id` header or generated UUID)
- `headers` - Request headers
- `query` - Query parameters
- `params` - Route parameters
- `body` - Request body
- `user` - Authenticated user (if available)
- `ip` - Client IP address
- `method` - HTTP method
- `url` - Request URL
- `protocol` - Request protocol
- `secure` - Whether the request is secure (HTTPS)
- `hostname` - Request hostname
- `port` - Request port
- `path` - Request path
- `search` - Query string
- `searchParams` - Parsed search parameters
- `origin` - Request origin
- `referer` - Referer header
- `userAgent` - User agent header

## Related Packages

This library is typically used alongside other Dismissible packages:

- `@dismissible/nestjs-hooks` - Provides the `IRequestContext` interface
- `@dismissible/nestjs-core` - Main dismissible service and module

## License

MIT
