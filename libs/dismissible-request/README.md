# @dismissible/nestjs-dismissible-request

Request context decorator for Dismissible applications.

> **Part of the Dismissible API** - This library is part of the [Dismissible API](https://dismissible.io) ecosystem. Visit [dismissible.io](https://dismissible.io) for more information and documentation.

## Overview

This library provides a NestJS parameter decorator for extracting request context from HTTP requests:

- `RequestContext` - Parameter decorator that extracts request context from the current HTTP request

## Installation

```bash
npm install @dismissible/nestjs-dismissible-request
```

## Getting Started

### Basic Usage

Use the `RequestContext` decorator in your controllers to extract request context:

```typescript
import { Controller, Get } from '@nestjs/common';
import { RequestContext, IRequestContext } from '@dismissible/nestjs-dismissible-request';

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

- `@dismissible/nestjs-dismissible-hooks` - Provides the `IRequestContext` interface
- `@dismissible/nestjs-dismissible` - Main dismissible service and module

## License

MIT
