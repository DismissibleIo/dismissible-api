import { z } from 'zod';

// Core Settings Schema
export const coreConfigSchema = z.object({
  port: z.number().int().min(1).max(65535),
  storageType: z.enum(['postgres', 'dynamodb', 'memory']),
  storageRunSetup: z.boolean(),
});

export type CoreConfig = z.infer<typeof coreConfigSchema>;

// PostgreSQL Storage Schema
export const postgresStorageSchema = z.object({
  type: z.literal('postgres'),
  connectionString: z
    .string()
    .min(1, 'PostgreSQL connection string is required')
    .refine(
      (s) => s.startsWith('postgresql://') || s.startsWith('postgres://'),
      'Connection string must start with postgresql:// or postgres://',
    ),
});

// DynamoDB Storage Schema
export const dynamodbStorageSchema = z.object({
  type: z.literal('dynamodb'),
  tableName: z.string().min(1),
  awsRegion: z.string().min(1),
  awsAccessKeyId: z.string().optional(),
  awsSecretAccessKey: z.string().optional(),
  awsSessionToken: z.string().optional(),
  endpoint: z.string().optional(),
});

// Memory Storage Schema
export const memoryStorageSchema = z.object({
  type: z.literal('memory'),
  maxItems: z.number().int().min(1),
  ttlMs: z.number().int().min(1),
});

// Discriminated Union for Storage
export const storageConfigSchema = z.discriminatedUnion('type', [
  postgresStorageSchema,
  dynamodbStorageSchema,
  memoryStorageSchema,
]);

export type StorageConfig = z.infer<typeof storageConfigSchema>;

// Redis Cache Schema
export const redisCacheSchema = z.object({
  type: z.literal('redis'),
  url: z.string().min(1, 'Redis URL is required'),
  keyPrefix: z.string(),
  ttlMs: z.number().int().min(1),
  enableReadyCheck: z.boolean(),
  maxRetries: z.number().int().min(0),
  connectionTimeoutMs: z.number().int().min(1),
});

// Memory Cache Schema
export const memoryCacheSchema = z.object({
  type: z.literal('memory'),
  maxItems: z.number().int().min(1),
  ttlMs: z.number().int().min(1),
});

// No Cache Schema
export const noCacheSchema = z.object({
  type: z.literal('none'),
});

// Discriminated Union for Cache
export const cacheConfigSchema = z.discriminatedUnion('type', [
  redisCacheSchema,
  memoryCacheSchema,
  noCacheSchema,
]);

export type CacheConfig = z.infer<typeof cacheConfigSchema>;

// Swagger Schema
export const swaggerConfigSchema = z.object({
  enabled: z.boolean(),
  path: z.string().min(1),
});

export type SwaggerConfig = z.infer<typeof swaggerConfigSchema>;

// JWT Auth Schema
export const jwtAuthConfigSchema = z
  .object({
    enabled: z.boolean(),
    wellKnownUrl: z.string().url().optional(),
    issuer: z.string().optional(),
    audience: z.string().optional(),
    algorithms: z.string(),
    jwksCacheDuration: z.number().int().min(1),
    requestTimeout: z.number().int().min(1),
    priority: z.number().int(),
    matchUserId: z.boolean(),
    userIdClaim: z.string().min(1),
    userIdMatchType: z.enum(['exact', 'substring', 'regex']),
    userIdMatchRegex: z.string().optional(),
  })
  .refine((data) => !data.enabled || (data.enabled && data.wellKnownUrl), {
    message: 'Well-known URL is required when JWT auth is enabled',
    path: ['wellKnownUrl'],
  })
  .refine(
    (data) =>
      data.userIdMatchType !== 'regex' ||
      (data.userIdMatchType === 'regex' && data.userIdMatchRegex),
    {
      message: 'Regex pattern is required when match type is regex',
      path: ['userIdMatchRegex'],
    },
  );

export type JwtAuthConfig = z.infer<typeof jwtAuthConfigSchema>;

// CORS Schema
export const corsConfigSchema = z.object({
  enabled: z.boolean(),
  origins: z.string().optional(),
  methods: z.string().min(1),
  allowedHeaders: z.string().min(1),
  credentials: z.boolean(),
  maxAge: z.number().int().min(0),
});

export type CorsConfig = z.infer<typeof corsConfigSchema>;

// Helmet Schema
export const helmetConfigSchema = z.object({
  enabled: z.boolean(),
  csp: z.boolean(),
  coep: z.boolean(),
  hstsMaxAge: z.number().int().min(0),
  hstsIncludeSubdomains: z.boolean(),
  hstsPreload: z.boolean(),
});

export type HelmetConfig = z.infer<typeof helmetConfigSchema>;

// Validation Schema
export const validationConfigSchema = z.object({
  disableErrorMessages: z.boolean(),
  whitelist: z.boolean(),
  forbidNonWhitelisted: z.boolean(),
  transform: z.boolean(),
});

export type ValidationConfig = z.infer<typeof validationConfigSchema>;

// Rate Limiter Schema
export const rateLimiterConfigSchema = z.object({
  enabled: z.boolean(),
  points: z.number().int().min(1),
  duration: z.number().int().min(1),
  blockDuration: z.number().int().min(0),
  keyType: z.string().min(1),
  keyMode: z.enum(['and', 'or', 'any']),
  ignoredKeys: z.string().optional(),
  priority: z.number().int(),
});

export type RateLimiterConfig = z.infer<typeof rateLimiterConfigSchema>;

// Complete Wizard Configuration Schema
export const wizardConfigSchema = z.object({
  core: coreConfigSchema,
  storage: storageConfigSchema,
  cache: cacheConfigSchema,
  swagger: swaggerConfigSchema,
  jwtAuth: jwtAuthConfigSchema,
  cors: corsConfigSchema,
  helmet: helmetConfigSchema,
  validation: validationConfigSchema,
  rateLimiter: rateLimiterConfigSchema,
});

export type WizardConfig = z.infer<typeof wizardConfigSchema>;
