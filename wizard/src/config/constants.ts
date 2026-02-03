export const ENV_VAR_NAMES = {
  // Core
  DISMISSIBLE_PORT: 'DISMISSIBLE_PORT',
  DISMISSIBLE_STORAGE_TYPE: 'DISMISSIBLE_STORAGE_TYPE',
  DISMISSIBLE_STORAGE_RUN_SETUP: 'DISMISSIBLE_STORAGE_RUN_SETUP',

  // PostgreSQL Storage
  DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING: 'DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING',

  // DynamoDB Storage
  DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME: 'DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME',
  DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION: 'DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION',
  DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID: 'DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID',
  DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY:
    'DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY',
  DISMISSIBLE_STORAGE_DYNAMODB_AWS_SESSION_TOKEN: 'DISMISSIBLE_STORAGE_DYNAMODB_AWS_SESSION_TOKEN',
  DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT: 'DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT',

  // Memory Storage
  DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS: 'DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS',
  DISMISSIBLE_STORAGE_MEMORY_TTL_MS: 'DISMISSIBLE_STORAGE_MEMORY_TTL_MS',

  // Cache
  DISMISSIBLE_CACHE_TYPE: 'DISMISSIBLE_CACHE_TYPE',

  // Redis Cache
  DISMISSIBLE_CACHE_REDIS_URL: 'DISMISSIBLE_CACHE_REDIS_URL',
  DISMISSIBLE_CACHE_REDIS_KEY_PREFIX: 'DISMISSIBLE_CACHE_REDIS_KEY_PREFIX',
  DISMISSIBLE_CACHE_REDIS_TTL_MS: 'DISMISSIBLE_CACHE_REDIS_TTL_MS',
  DISMISSIBLE_CACHE_REDIS_ENABLE_READY_CHECK: 'DISMISSIBLE_CACHE_REDIS_ENABLE_READY_CHECK',
  DISMISSIBLE_CACHE_REDIS_MAX_RETRIES: 'DISMISSIBLE_CACHE_REDIS_MAX_RETRIES',
  DISMISSIBLE_CACHE_REDIS_CONNECTION_TIMEOUT_MS: 'DISMISSIBLE_CACHE_REDIS_CONNECTION_TIMEOUT_MS',

  // Memory Cache
  DISMISSIBLE_CACHE_MEMORY_MAX_ITEMS: 'DISMISSIBLE_CACHE_MEMORY_MAX_ITEMS',
  DISMISSIBLE_CACHE_MEMORY_TTL_MS: 'DISMISSIBLE_CACHE_MEMORY_TTL_MS',

  // Swagger
  DISMISSIBLE_SWAGGER_ENABLED: 'DISMISSIBLE_SWAGGER_ENABLED',
  DISMISSIBLE_SWAGGER_PATH: 'DISMISSIBLE_SWAGGER_PATH',

  // JWT Auth
  DISMISSIBLE_JWT_AUTH_ENABLED: 'DISMISSIBLE_JWT_AUTH_ENABLED',
  DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL: 'DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL',
  DISMISSIBLE_JWT_AUTH_ISSUER: 'DISMISSIBLE_JWT_AUTH_ISSUER',
  DISMISSIBLE_JWT_AUTH_AUDIENCE: 'DISMISSIBLE_JWT_AUTH_AUDIENCE',
  DISMISSIBLE_JWT_AUTH_ALGORITHMS: 'DISMISSIBLE_JWT_AUTH_ALGORITHMS',
  DISMISSIBLE_JWT_AUTH_JWKS_CACHE_DURATION: 'DISMISSIBLE_JWT_AUTH_JWKS_CACHE_DURATION',
  DISMISSIBLE_JWT_AUTH_REQUEST_TIMEOUT: 'DISMISSIBLE_JWT_AUTH_REQUEST_TIMEOUT',
  DISMISSIBLE_JWT_AUTH_PRIORITY: 'DISMISSIBLE_JWT_AUTH_PRIORITY',
  DISMISSIBLE_JWT_AUTH_MATCH_USER_ID: 'DISMISSIBLE_JWT_AUTH_MATCH_USER_ID',
  DISMISSIBLE_JWT_AUTH_USER_ID_CLAIM: 'DISMISSIBLE_JWT_AUTH_USER_ID_CLAIM',
  DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_TYPE: 'DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_TYPE',
  DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_REGEX: 'DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_REGEX',

  // CORS
  DISMISSIBLE_CORS_ENABLED: 'DISMISSIBLE_CORS_ENABLED',
  DISMISSIBLE_CORS_ORIGINS: 'DISMISSIBLE_CORS_ORIGINS',
  DISMISSIBLE_CORS_METHODS: 'DISMISSIBLE_CORS_METHODS',
  DISMISSIBLE_CORS_ALLOWED_HEADERS: 'DISMISSIBLE_CORS_ALLOWED_HEADERS',
  DISMISSIBLE_CORS_CREDENTIALS: 'DISMISSIBLE_CORS_CREDENTIALS',
  DISMISSIBLE_CORS_MAX_AGE: 'DISMISSIBLE_CORS_MAX_AGE',

  // Helmet
  DISMISSIBLE_HELMET_ENABLED: 'DISMISSIBLE_HELMET_ENABLED',
  DISMISSIBLE_HELMET_CSP: 'DISMISSIBLE_HELMET_CSP',
  DISMISSIBLE_HELMET_COEP: 'DISMISSIBLE_HELMET_COEP',
  DISMISSIBLE_HELMET_HSTS_MAX_AGE: 'DISMISSIBLE_HELMET_HSTS_MAX_AGE',
  DISMISSIBLE_HELMET_HSTS_INCLUDE_SUBDOMAINS: 'DISMISSIBLE_HELMET_HSTS_INCLUDE_SUBDOMAINS',
  DISMISSIBLE_HELMET_HSTS_PRELOAD: 'DISMISSIBLE_HELMET_HSTS_PRELOAD',

  // Validation
  DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES: 'DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES',
  DISMISSIBLE_VALIDATION_WHITELIST: 'DISMISSIBLE_VALIDATION_WHITELIST',
  DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED: 'DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED',
  DISMISSIBLE_VALIDATION_TRANSFORM: 'DISMISSIBLE_VALIDATION_TRANSFORM',

  // Rate Limiter
  DISMISSIBLE_RATE_LIMITER_ENABLED: 'DISMISSIBLE_RATE_LIMITER_ENABLED',
  DISMISSIBLE_RATE_LIMITER_POINTS: 'DISMISSIBLE_RATE_LIMITER_POINTS',
  DISMISSIBLE_RATE_LIMITER_DURATION: 'DISMISSIBLE_RATE_LIMITER_DURATION',
  DISMISSIBLE_RATE_LIMITER_BLOCK_DURATION: 'DISMISSIBLE_RATE_LIMITER_BLOCK_DURATION',
  DISMISSIBLE_RATE_LIMITER_KEY_TYPE: 'DISMISSIBLE_RATE_LIMITER_KEY_TYPE',
  DISMISSIBLE_RATE_LIMITER_KEY_MODE: 'DISMISSIBLE_RATE_LIMITER_KEY_MODE',
  DISMISSIBLE_RATE_LIMITER_IGNORED_KEYS: 'DISMISSIBLE_RATE_LIMITER_IGNORED_KEYS',
  DISMISSIBLE_RATE_LIMITER_PRIORITY: 'DISMISSIBLE_RATE_LIMITER_PRIORITY',
} as const;

export const HELP_TEXT = {
  // Core
  port: 'Port the API will listen on',
  storageType: 'Storage backend type: postgres, dynamodb, or memory',
  storageRunSetup: 'Run database migrations on startup',

  // PostgreSQL
  postgresConnectionString:
    'PostgreSQL connection string (e.g., postgresql://user:password@host:port/database)',

  // DynamoDB
  dynamodbTableName: 'DynamoDB table name',
  dynamodbAwsRegion: 'AWS region (e.g., us-east-1)',
  dynamodbAwsAccessKeyId: 'AWS access key ID for authentication',
  dynamodbAwsSecretAccessKey: 'AWS secret access key for authentication',
  dynamodbAwsSessionToken: 'AWS session token for temporary credentials',
  dynamodbEndpoint: 'LocalStack or DynamoDB Local endpoint URL (optional)',

  // Memory Storage
  memoryStorageMaxItems: 'Maximum number of items to store in memory',
  memoryStorageTtlMs: 'Time-to-live in milliseconds for stored items',

  // Cache
  cacheType: 'Cache backend type: redis, memory, or none for no caching',

  // Redis Cache
  redisCacheUrl: 'Redis connection URL (e.g., redis://localhost:6379)',
  redisCacheKeyPrefix: 'Prefix for all cache keys',
  redisCacheTtlMs: 'Time-to-live in milliseconds for cached items',
  redisCacheEnableReadyCheck: 'Enable ready check before accepting requests',
  redisCacheMaxRetries: 'Maximum retries per request',
  redisCacheConnectionTimeoutMs: 'Connection timeout in milliseconds',

  // Memory Cache
  memoryCacheMaxItems: 'Maximum number of items to cache in memory',
  memoryCacheTtlMs: 'Time-to-live in milliseconds for cached items',

  // Swagger
  swaggerEnabled: 'Enable Swagger API documentation',
  swaggerPath: 'Path for Swagger docs (e.g., "docs" for /docs)',

  // JWT Auth
  jwtAuthEnabled: 'Enable JWT authentication to secure your API',
  jwtAuthWellKnownUrl: 'OIDC discovery URL (required when JWT auth is enabled)',
  jwtAuthIssuer: 'Expected JWT issuer',
  jwtAuthAudience: 'Expected JWT audience',
  jwtAuthAlgorithms: 'Allowed algorithms (comma-separated, e.g., RS256,RS384)',
  jwtAuthJwksCacheDuration: 'JWKS cache duration in milliseconds',
  jwtAuthRequestTimeout: 'Request timeout in milliseconds',
  jwtAuthPriority: 'Hook priority (lower runs first)',
  jwtAuthMatchUserId: 'Enable user ID matching from JWT claims',
  jwtAuthUserIdClaim: 'JWT claim key for user ID matching',
  jwtAuthUserIdMatchType: 'Match method: exact, substring, or regex',
  jwtAuthUserIdMatchRegex: 'Regex pattern (required if match type is regex)',

  // CORS
  corsEnabled: 'Enable Cross-Origin Resource Sharing (CORS)',
  corsOrigins:
    'Allowed origins (comma-separated, e.g., https://example.com,https://app.example.com)',
  corsMethods: 'Allowed HTTP methods',
  corsAllowedHeaders: 'Allowed headers',
  corsCredentials: 'Allow credentials (cookies, authorization headers)',
  corsMaxAge: 'Preflight cache duration in seconds',

  // Helmet
  helmetEnabled: 'Enable Helmet security headers',
  helmetCsp: 'Enable Content Security Policy',
  helmetCoep: 'Enable Cross-Origin Embedder Policy',
  helmetHstsMaxAge: 'HSTS max age in seconds',
  helmetHstsIncludeSubdomains: 'Include subdomains in HSTS',
  helmetHstsPreload: 'Enable HSTS preload',

  // Validation
  validationDisableErrorMessages: 'Hide detailed validation error messages',
  validationWhitelist: 'Strip unknown properties from requests',
  validationForbidNonWhitelisted: 'Reject requests with unknown properties',
  validationTransform: 'Auto-transform payloads to DTOs',

  // Rate Limiter
  rateLimiterEnabled: 'Enable rate limiting to protect against abuse',
  rateLimiterPoints: 'Number of requests allowed per duration window',
  rateLimiterDuration: 'Time window in seconds',
  rateLimiterBlockDuration: 'Duration in seconds to block requests after limit exceeded',
  rateLimiterKeyType: 'Key types for rate limiting (comma-separated: ip, origin, referrer)',
  rateLimiterKeyMode: 'Mode for combining key types: and, or, any',
  rateLimiterIgnoredKeys: 'Comma-separated keys to bypass rate limiting',
  rateLimiterPriority: 'Hook priority (lower runs first)',
} as const;
