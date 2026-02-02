import { WizardConfig } from './schema';

export const defaultConfig: WizardConfig = {
  core: {
    port: 3001,
    storageType: 'memory',
    storageRunSetup: true,
  },
  storage: {
    type: 'memory',
    maxItems: 5000,
    ttlMs: 21600000, // 6 hours
  },
  cache: {
    type: 'none',
  },
  swagger: {
    enabled: false,
    path: 'docs',
  },
  jwtAuth: {
    enabled: false,
    wellKnownUrl: undefined,
    issuer: undefined,
    audience: undefined,
    algorithms: 'RS256',
    jwksCacheDuration: 600000, // 10 minutes
    requestTimeout: 30000, // 30 seconds
    priority: -100,
    matchUserId: true,
    userIdClaim: 'sub',
    userIdMatchType: 'exact',
    userIdMatchRegex: undefined,
  },
  cors: {
    enabled: false,
    origins: undefined,
    methods: 'GET,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,x-request-id',
    credentials: true,
    maxAge: 86400, // 24 hours
  },
  helmet: {
    enabled: true,
    csp: true,
    coep: true,
    hstsMaxAge: 31536000, // 1 year
    hstsIncludeSubdomains: true,
    hstsPreload: false,
  },
  validation: {
    disableErrorMessages: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  },
  rateLimiter: {
    enabled: false,
    points: 1000,
    duration: 1,
    blockDuration: 60,
    keyType: 'ip,origin,referrer',
    keyMode: 'any',
    ignoredKeys: undefined,
    priority: -101,
  },
};
