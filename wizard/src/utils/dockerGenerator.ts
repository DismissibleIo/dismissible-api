import { WizardConfig } from '../config/schema';
import { ENV_VAR_NAMES } from '../config/constants';
import { escapeShellValue } from './escaping';

/**
 * Helper to create a safe environment variable string.
 * Values are escaped to prevent shell injection.
 */
function envVar(name: string, value: string | number | boolean): string {
  return `${name}=${escapeShellValue(value)}`;
}

export function generateDockerCommand(config: WizardConfig): string {
  const envVars: string[] = [];

  // Core Settings
  envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_PORT, config.core.port));
  envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_STORAGE_TYPE, config.core.storageType));
  envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_STORAGE_RUN_SETUP, config.core.storageRunSetup));

  // Storage Settings
  if (config.storage.type === 'postgres') {
    envVars.push(
      envVar(
        ENV_VAR_NAMES.DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING,
        config.storage.connectionString,
      ),
    );
  } else if (config.storage.type === 'dynamodb') {
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME, config.storage.tableName),
    );
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION, config.storage.awsRegion),
    );
    if (config.storage.awsAccessKeyId) {
      envVars.push(
        envVar(
          ENV_VAR_NAMES.DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID,
          config.storage.awsAccessKeyId,
        ),
      );
    }
    if (config.storage.awsSecretAccessKey) {
      envVars.push(
        envVar(
          ENV_VAR_NAMES.DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY,
          config.storage.awsSecretAccessKey,
        ),
      );
    }
    if (config.storage.awsSessionToken) {
      envVars.push(
        envVar(
          ENV_VAR_NAMES.DISMISSIBLE_STORAGE_DYNAMODB_AWS_SESSION_TOKEN,
          config.storage.awsSessionToken,
        ),
      );
    }
    if (config.storage.endpoint) {
      envVars.push(
        envVar(ENV_VAR_NAMES.DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT, config.storage.endpoint),
      );
    }
  } else if (config.storage.type === 'memory') {
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS, config.storage.maxItems),
    );
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_STORAGE_MEMORY_TTL_MS, config.storage.ttlMs));
  }

  // Cache Settings
  if (config.cache.type !== 'none') {
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_CACHE_TYPE, config.cache.type));
    if (config.cache.type === 'redis') {
      envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_CACHE_REDIS_URL, config.cache.url));
      envVars.push(
        envVar(ENV_VAR_NAMES.DISMISSIBLE_CACHE_REDIS_KEY_PREFIX, config.cache.keyPrefix),
      );
      envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_CACHE_REDIS_TTL_MS, config.cache.ttlMs));
      envVars.push(
        envVar(
          ENV_VAR_NAMES.DISMISSIBLE_CACHE_REDIS_ENABLE_READY_CHECK,
          config.cache.enableReadyCheck,
        ),
      );
      envVars.push(
        envVar(ENV_VAR_NAMES.DISMISSIBLE_CACHE_REDIS_MAX_RETRIES, config.cache.maxRetries),
      );
      envVars.push(
        envVar(
          ENV_VAR_NAMES.DISMISSIBLE_CACHE_REDIS_CONNECTION_TIMEOUT_MS,
          config.cache.connectionTimeoutMs,
        ),
      );
    } else if (config.cache.type === 'memory') {
      envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_CACHE_MEMORY_MAX_ITEMS, config.cache.maxItems));
      envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_CACHE_MEMORY_TTL_MS, config.cache.ttlMs));
    }
  }

  // Swagger
  if (config.swagger.enabled) {
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_SWAGGER_ENABLED, config.swagger.enabled));
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_SWAGGER_PATH, config.swagger.path));
  }

  // JWT Auth
  if (config.jwtAuth.enabled) {
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_JWT_AUTH_ENABLED, config.jwtAuth.enabled));
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL, config.jwtAuth.wellKnownUrl),
    );
    if (config.jwtAuth.issuer) {
      envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_JWT_AUTH_ISSUER, config.jwtAuth.issuer));
    }
    if (config.jwtAuth.audience) {
      envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_JWT_AUTH_AUDIENCE, config.jwtAuth.audience));
    }
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_JWT_AUTH_ALGORITHMS, config.jwtAuth.algorithms));
    envVars.push(
      envVar(
        ENV_VAR_NAMES.DISMISSIBLE_JWT_AUTH_JWKS_CACHE_DURATION,
        config.jwtAuth.jwksCacheDuration,
      ),
    );
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_JWT_AUTH_REQUEST_TIMEOUT, config.jwtAuth.requestTimeout),
    );
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_JWT_AUTH_PRIORITY, config.jwtAuth.priority));
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_JWT_AUTH_MATCH_USER_ID, config.jwtAuth.matchUserId),
    );
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_JWT_AUTH_USER_ID_CLAIM, config.jwtAuth.userIdClaim),
    );
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_TYPE, config.jwtAuth.userIdMatchType),
    );
    if (config.jwtAuth.userIdMatchRegex) {
      envVars.push(
        envVar(
          ENV_VAR_NAMES.DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_REGEX,
          config.jwtAuth.userIdMatchRegex,
        ),
      );
    }
  }

  // CORS
  if (config.cors.enabled) {
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_CORS_ENABLED, config.cors.enabled));
    if (config.cors.origins) {
      envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_CORS_ORIGINS, config.cors.origins));
    }
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_CORS_METHODS, config.cors.methods));
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_CORS_ALLOWED_HEADERS, config.cors.allowedHeaders),
    );
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_CORS_CREDENTIALS, config.cors.credentials));
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_CORS_MAX_AGE, config.cors.maxAge));
  }

  // Helmet
  envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_HELMET_ENABLED, config.helmet.enabled));
  if (config.helmet.enabled) {
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_HELMET_CSP, config.helmet.csp));
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_HELMET_COEP, config.helmet.coep));
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_HELMET_HSTS_MAX_AGE, config.helmet.hstsMaxAge));
    envVars.push(
      envVar(
        ENV_VAR_NAMES.DISMISSIBLE_HELMET_HSTS_INCLUDE_SUBDOMAINS,
        config.helmet.hstsIncludeSubdomains,
      ),
    );
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_HELMET_HSTS_PRELOAD, config.helmet.hstsPreload));
  }

  // Validation
  envVars.push(
    envVar(
      ENV_VAR_NAMES.DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES,
      config.validation.disableErrorMessages,
    ),
  );
  envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_VALIDATION_WHITELIST, config.validation.whitelist));
  envVars.push(
    envVar(
      ENV_VAR_NAMES.DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED,
      config.validation.forbidNonWhitelisted,
    ),
  );
  envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_VALIDATION_TRANSFORM, config.validation.transform));

  // Rate Limiter
  if (config.rateLimiter.enabled) {
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_RATE_LIMITER_ENABLED, config.rateLimiter.enabled),
    );
    envVars.push(envVar(ENV_VAR_NAMES.DISMISSIBLE_RATE_LIMITER_POINTS, config.rateLimiter.points));
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_RATE_LIMITER_DURATION, config.rateLimiter.duration),
    );
    envVars.push(
      envVar(
        ENV_VAR_NAMES.DISMISSIBLE_RATE_LIMITER_BLOCK_DURATION,
        config.rateLimiter.blockDuration,
      ),
    );
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_RATE_LIMITER_KEY_TYPE, config.rateLimiter.keyType),
    );
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_RATE_LIMITER_KEY_MODE, config.rateLimiter.keyMode),
    );
    if (config.rateLimiter.ignoredKeys) {
      envVars.push(
        envVar(ENV_VAR_NAMES.DISMISSIBLE_RATE_LIMITER_IGNORED_KEYS, config.rateLimiter.ignoredKeys),
      );
    }
    envVars.push(
      envVar(ENV_VAR_NAMES.DISMISSIBLE_RATE_LIMITER_PRIORITY, config.rateLimiter.priority),
    );
  }

  // Note: Values are escaped to prevent shell injection, but always review
  // the generated command before running it in production.
  const envFlags = envVars.map((v) => `-e "${v}"`).join(' \\\n  ');

  return `docker run -d \\
  --name dismissible-api \\
  -p ${config.core.port}:3001 \\
  ${envFlags} \\
  dismissibleio/dismissible-api:latest`;
}
