<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="https://raw.githubusercontent.com/DismissibleIo/dismissible-api/main/docs/images/dismissible_logo.png" width="120" alt="Dismissible" /></a>
</p>

<p align="center">Never Show The Same Thing Twice!</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-rate-limiter-hook" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/nestjs-rate-limiter-hook.svg" alt="NPM Version" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@dismissible/nestjs-rate-limiter-hook.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-rate-limiter-hook" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/nestjs-rate-limiter-hook.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-api/release.yml"></a>
  <a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
</p>

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

# @dismissible/nestjs-rate-limiter-hook

Rate limiting hook for Dismissible applications using in-memory rate limiting.

## Overview

This library provides a lifecycle hook that integrates with the `@dismissible/nestjs-core` module to rate limit requests. It uses the `rate-limiter-flexible` library for efficient in-memory rate limiting.

## Installation

```bash
npm install @dismissible/nestjs-rate-limiter-hook
```

## Usage

### Basic Setup

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-core';
import { RateLimiterHookModule, RateLimiterHook } from '@dismissible/nestjs-rate-limiter-hook';

@Module({
  imports: [
    // Configure the rate limiter hook module
    RateLimiterHookModule.forRoot({
      enabled: true,
      points: 10, // 10 requests
      duration: 1, // per 1 second
      keyType: ['ip'], // rate limit by IP address
    }),

    // Pass the hook to the DismissibleModule
    DismissibleModule.forRoot({
      hooks: [RateLimiterHook],
      // ... other options
    }),
  ],
})
export class AppModule {}
```

### Async Configuration

When configuration values come from environment variables or other async sources:

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DismissibleModule } from '@dismissible/nestjs-core';
import { RateLimiterHookModule, RateLimiterHook } from '@dismissible/nestjs-rate-limiter-hook';

@Module({
  imports: [
    RateLimiterHookModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        enabled: configService.get('RATE_LIMITER_ENABLED', true),
        points: configService.get('RATE_LIMITER_POINTS', 10),
        duration: configService.get('RATE_LIMITER_DURATION', 1),
        keyType: configService.get('RATE_LIMITER_KEY_TYPE', 'ip').split(','),
      }),
      inject: [ConfigService],
    }),

    DismissibleModule.forRoot({
      hooks: [RateLimiterHook],
    }),
  ],
})
export class AppModule {}
```

## Configuration Options

| Option          | Type                 | Required | Default | Description                                                            |
| --------------- | -------------------- | -------- | ------- | ---------------------------------------------------------------------- |
| `enabled`       | `boolean`            | Yes      | -       | Whether rate limiting is enabled                                       |
| `points`        | `number`             | Yes\*    | -       | Number of requests allowed per duration                                |
| `duration`      | `number`             | Yes\*    | -       | Time window in seconds                                                 |
| `blockDuration` | `number`             | No       | -       | Duration in seconds to block requests after limit is exceeded          |
| `keyType`       | `RateLimitKeyType[]` | Yes\*    | -       | Key source(s) for rate limiting: `ip`, `origin`, `referrer`            |
| `keyMode`       | `RateLimitKeyMode`   | No       | `and`   | Mode for combining key types: `and`, `or`, `any`                       |
| `priority`      | `number`             | No       | `-50`   | Hook priority (lower numbers run first, runs after auth hooks at -100) |

\* Required when `enabled` is `true`.

### Key Types

- **`ip`**: Rate limit by IP address (extracted from `x-forwarded-for` or `x-real-ip` headers)
- **`origin`**: Rate limit by Origin header (useful for CORS scenarios)
- **`referrer`**: Rate limit by Referer header

### Key Modes

When multiple key types are specified, the `keyMode` determines how they are combined:

- **`and`** (default): Combine all key types into a single key. For example, `keyType: ['ip', 'origin']` creates keys like `192.168.1.1:example.com`. All requests from the same IP+Origin combination share the same rate limit bucket.

- **`or`**: Use the first available key type as a fallback chain. For example, with `keyType: ['ip', 'origin', 'referrer']`:
  - If IP is available, use IP
  - If IP is not available but Origin is, use Origin
  - If neither IP nor Origin is available, use Referrer
  - Useful when you want to rate limit by the most reliable identifier available

- **`any`**: Check all key types independently - the request is blocked if ANY key type exceeds the limit. Each key type gets its own rate limit bucket. For example, with `keyType: ['ip', 'origin']`:
  - Keys are prefixed: `ip:192.168.1.1` and `origin:example.com`
  - Both buckets are checked
  - Request is blocked if either bucket is exhausted
  - This is the strictest mode

## Environment Variables

When using the Dismissible API Docker image or the standalone API, these environment variables configure rate limiting:

| Variable                                  | Description                                   | Default |
| ----------------------------------------- | --------------------------------------------- | ------- |
| `DISMISSIBLE_RATE_LIMITER_ENABLED`        | Enable rate limiting                          | `false` |
| `DISMISSIBLE_RATE_LIMITER_POINTS`         | Number of requests allowed per duration       | `10`    |
| `DISMISSIBLE_RATE_LIMITER_DURATION`       | Time window in seconds                        | `1`     |
| `DISMISSIBLE_RATE_LIMITER_BLOCK_DURATION` | Block duration after limit exceeded (seconds) | -       |
| `DISMISSIBLE_RATE_LIMITER_KEY_TYPE`       | Key type(s) (comma-separated)                 | `ip`    |
| `DISMISSIBLE_RATE_LIMITER_KEY_MODE`       | Key combination mode: `and`, `or`, `any`      | `and`   |
| `DISMISSIBLE_RATE_LIMITER_PRIORITY`       | Hook priority (lower runs first)              | `-50`   |

### Example: Enabling Rate Limiting

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_RATE_LIMITER_ENABLED=true \
  -e DISMISSIBLE_RATE_LIMITER_POINTS=100 \
  -e DISMISSIBLE_RATE_LIMITER_DURATION=60 \
  -e DISMISSIBLE_RATE_LIMITER_KEY_TYPE="ip,origin" \
  -e DISMISSIBLE_RATE_LIMITER_KEY_MODE="or" \
  -e DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://..." \
  dismissibleio/dismissible-api:latest
```

This configuration allows 100 requests per minute, rate limiting by IP if available, otherwise by Origin (using OR mode).

## How It Works

1. **Key Generation**: For each request, the hook generates rate limit key(s) based on the configured key types and mode:
   - **AND mode**: Creates a single combined key (e.g., `192.168.1.1:example.com`)
   - **OR mode**: Uses the first available key type from the list
   - **ANY mode**: Creates separate keys for each key type (e.g., `ip:192.168.1.1`, `origin:example.com`)

2. **Rate Limit Check**: The key(s) are checked against the rate limiter. Each request consumes one "point" from the available pool(s).

3. **Request Handling**:
   - If points remain (for all keys in ANY mode): The request proceeds
   - If limit exceeded: The request is blocked with a `429 Too Many Requests` response

4. **Window Reset**: After the `duration` period, the points reset. If `blockDuration` is configured, blocked clients must wait for that duration before being allowed again.

## Error Responses

When rate limit is exceeded, the hook throws a `TooManyRequestsException`:

```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded. Please try again later.",
  "error": "Too Many Requests"
}
```

The exception includes a `retryAfter` property indicating how many seconds until the rate limit resets.

## License

MIT
