<p align="center">
  <a href="https://dismissible.io" target="_blank"><img src="../../docs/images/dismissible_logo.png" width="120" alt="Dismissible" /></a>
</p>

<p align="center">Never Show The Same Thing Twice!</p>
<p align="center">
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-jwt-auth-hook" target="_blank"><img src="https://img.shields.io/npm/v/@dismissible/nestjs-jwt-auth-hook.svg" alt="NPM Version" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@dismissible/nestjs-jwt-auth-hook.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/@dismissible/nestjs-jwt-auth-hook" target="_blank"><img src="https://img.shields.io/npm/dm/@dismissible/nestjs-jwt-auth-hook.svg" alt="NPM Downloads" /></a>
  <a href="https://github.com/dismissibleio/dismissible-api" target="_blank"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/dismissibleio/dismissible-api/release.yml"></a>
  <a href="https://paypal.me/joshstuartx" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
</p>

Dismissible manages the state of your UI elements across sessions, so your users see what matters, once! No more onboarding messages reappearing on every tab, no more notifications haunting users across devices. Dismissible syncs dismissal state everywhere, so every message is intentional, never repetitive.

# @dismissible/nestjs-jwt-auth-hook

JWT authentication hook for Dismissible applications using OpenID Connect (OIDC) well-known discovery.

## Overview

This library provides a lifecycle hook that integrates with the `@dismissible/nestjs-core` module to authenticate requests using JWT bearer tokens. It validates tokens using JWKS (JSON Web Key Set) fetched from an OIDC well-known endpoint.

## Installation

```bash
npm install @dismissible/nestjs-jwt-auth-hook @nestjs/axios axios
```

## Usage

### Basic Setup

```typescript
import { Module } from '@nestjs/common';
import { DismissibleModule } from '@dismissible/nestjs-core';
import { JwtAuthHookModule, JwtAuthHook } from '@dismissible/nestjs-jwt-auth-hook';

@Module({
  imports: [
    // Configure the JWT auth hook module
    JwtAuthHookModule.forRoot({
      wellKnownUrl: 'https://auth.example.com/.well-known/openid-configuration',
      issuer: 'https://auth.example.com',
      audience: 'my-api',
    }),

    // Pass the hook to the DismissibleModule
    DismissibleModule.forRoot({
      hooks: [JwtAuthHook],
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
import { JwtAuthHookModule, JwtAuthHook } from '@dismissible/nestjs-jwt-auth-hook';

@Module({
  imports: [
    JwtAuthHookModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        wellKnownUrl: configService.getOrThrow('OIDC_WELL_KNOWN_URL'),
        issuer: configService.get('OIDC_ISSUER'),
        audience: configService.get('OIDC_AUDIENCE'),
      }),
      inject: [ConfigService],
    }),

    DismissibleModule.forRoot({
      hooks: [JwtAuthHook],
    }),
  ],
})
export class AppModule {}
```

## Configuration Options

| Option              | Type       | Required | Default     | Description                                                                                 |
| ------------------- | ---------- | -------- | ----------- | ------------------------------------------------------------------------------------------- |
| `enabled`           | `boolean`  | Yes      | `true`      | Whether JWT authentication is enabled                                                       |
| `wellKnownUrl`      | `string`   | Yes\*    | -           | The OIDC well-known URL (e.g., `https://auth.example.com/.well-known/openid-configuration`) |
| `issuer`            | `string`   | No       | -           | Expected issuer (`iss`) claim. If not provided, issuer validation is skipped.               |
| `audience`          | `string`   | No       | -           | Expected audience (`aud`) claim. If not provided, audience validation is skipped.           |
| `algorithms`        | `string[]` | No       | `['RS256']` | Allowed algorithms for JWT verification                                                     |
| `jwksCacheDuration` | `number`   | No       | `600000`    | JWKS cache duration in milliseconds (10 minutes)                                            |
| `requestTimeout`    | `number`   | No       | `30000`     | Request timeout in milliseconds (30 seconds)                                                |
| `priority`          | `number`   | No       | `-100`      | Hook priority (lower numbers run first)                                                     |

\* `wellKnownUrl` is only required when `enabled` is `true`.

## Environment Variables

When using the Dismissible API Docker image or the standalone API, these environment variables configure JWT authentication:

| Variable                                   | Description                            | Default  |
| ------------------------------------------ | -------------------------------------- | -------- |
| `DISMISSIBLE_JWT_AUTH_ENABLED`             | Enable JWT authentication              | `true`   |
| `DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL`      | OIDC well-known URL for JWKS discovery | `""`     |
| `DISMISSIBLE_JWT_AUTH_ISSUER`              | Expected issuer claim (optional)       | `""`     |
| `DISMISSIBLE_JWT_AUTH_AUDIENCE`            | Expected audience claim (optional)     | `""`     |
| `DISMISSIBLE_JWT_AUTH_ALGORITHMS`          | Allowed algorithms (comma-separated)   | `RS256`  |
| `DISMISSIBLE_JWT_AUTH_JWKS_CACHE_DURATION` | JWKS cache duration in ms              | `600000` |
| `DISMISSIBLE_JWT_AUTH_REQUEST_TIMEOUT`     | Request timeout in ms                  | `30000`  |
| `DISMISSIBLE_JWT_AUTH_PRIORITY`            | Hook priority (lower runs first)       | `-100`   |

### Example: Disabling JWT Auth for Development

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_JWT_AUTH_ENABLED=false \
  -e DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://..." \
  dismissibleio/dismissible-api:latest
```

### Example: Enabling JWT Auth with Auth0

```bash
docker run -p 3001:3001 \
  -e DISMISSIBLE_JWT_AUTH_ENABLED=true \
  -e DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL="https://your-tenant.auth0.com/.well-known/openid-configuration" \
  -e DISMISSIBLE_JWT_AUTH_ISSUER="https://your-tenant.auth0.com/" \
  -e DISMISSIBLE_JWT_AUTH_AUDIENCE="your-api-identifier" \
  -e DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING="postgresql://..." \
  dismissibleio/dismissible-api:latest
```

## How It Works

1. **Initialization**: On module initialization, the hook fetches the OIDC configuration from the well-known URL to discover the JWKS endpoint.

2. **Token Extraction**: For each request, the hook extracts the bearer token from the `Authorization` header.

3. **Token Validation**: The token is validated by:
   - Decoding the JWT to get the key ID (`kid`)
   - Fetching the corresponding public key from JWKS
   - Verifying the signature
   - Validating claims (expiration, issuer, audience)

4. **Request Handling**:
   - If valid: The request proceeds
   - If invalid: The request is blocked with a `403 Forbidden` response

## Error Responses

When authentication fails, the hook returns a structured error:

```json
{
  "statusCode": 403,
  "message": "Authorization failed: Token expired",
  "error": "Forbidden"
}
```

Common error messages:

- `Authorization required: Missing or invalid bearer token`
- `Authorization failed: Token expired`
- `Authorization failed: Invalid signature`
- `Authorization failed: Unable to find signing key`

## Supported OIDC Providers

This hook works with any OIDC-compliant identity provider, including:

- Auth0
- Okta
- Keycloak
- Azure AD
- Google Identity Platform
- AWS Cognito

## License

MIT
