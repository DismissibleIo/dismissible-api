# =============================================================================
# Stage 1: Build
# =============================================================================
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies required for native modules
# Use --no-scripts to avoid busybox trigger issues in QEMU emulation for multi-platform builds
# Triggers for build dependencies (python3, make, g++) are not critical for the build process
RUN apk add --no-cache --no-scripts python3 make g++

COPY package*.json ./
COPY tsconfig.base.json nx.json ./
COPY api/ ./api/
COPY libs/ ./libs/

RUN npm install

# Init storage eg. prisma client generation etc
RUN npm run storage:init

# Build the application
RUN npm run build

# Prune dev dependencies for production
RUN npm prune --omit=dev

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM node:24-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy node_modules from builder (already pruned to production deps)
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy built libs to the symlinks created by npm workspaces (@dismissible/* -> ../../libs/*)
COPY --from=builder /app/dist/libs ./libs

# Copy built libs node_modules due to conflicting versions
COPY --from=builder /app/libs/request/node_modules ./libs/request/node_modules
COPY --from=builder /app/libs/storage/node_modules ./libs/storage/node_modules

# Copy Prisma schema and migrations (needed for migrations)
COPY --from=builder /app/libs/postgres-storage/prisma ./libs/postgres-storage/prisma

# Copy api package.json (needed for npm scripts)
COPY --from=builder /app/api/package.json ./api/package.json

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

# Install wget for health checks
# Use --no-scripts to avoid busybox trigger issues in QEMU emulation for multi-platform builds
RUN apk add --no-cache --no-scripts wget

# Make entrypoint script executable
RUN chmod +x /app/docker-entrypoint.sh

# Set ownership
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Environment variables with defaults
ENV NODE_ENV=production
ENV DISMISSIBLE_PORT=3001
ENV DISMISSIBLE_SWAGGER_ENABLED=false
ENV DISMISSIBLE_SWAGGER_PATH="docs"

# Storage Configuration
ENV DISMISSIBLE_RUN_STORAGE_SETUP=true
ENV DISMISSIBLE_STORAGE_TYPE="postgres"

# Postgres Storage Connection String
ENV DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING=""

# DynamoDB Storage
ENV DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME="dismissible-items"
ENV DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION="us-east-1"
ENV DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT=""
ENV DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID=""
ENV DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY=""
ENV DISMISSIBLE_STORAGE_DYNAMODB_AWS_SESSION_TOKEN=""

# JWT Authentication
ENV DISMISSIBLE_JWT_AUTH_ENABLED=false
ENV DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL=""
ENV DISMISSIBLE_JWT_AUTH_ISSUER=""
ENV DISMISSIBLE_JWT_AUTH_AUDIENCE=""
ENV DISMISSIBLE_JWT_AUTH_ALGORITHMS="RS256"
ENV DISMISSIBLE_JWT_AUTH_JWKS_CACHE_DURATION=600000
ENV DISMISSIBLE_JWT_AUTH_REQUEST_TIMEOUT=30000
ENV DISMISSIBLE_JWT_AUTH_PRIORITY=-100
ENV DISMISSIBLE_JWT_AUTH_MATCH_USER_ID=true
ENV DISMISSIBLE_JWT_AUTH_USER_ID_CLAIM="sub"
ENV DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_TYPE="exact"
ENV DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_REGEX=""

# Security Headers (Helmet)
ENV DISMISSIBLE_HELMET_ENABLED=true
ENV DISMISSIBLE_HELMET_CSP=true
ENV DISMISSIBLE_HELMET_COEP=true
ENV DISMISSIBLE_HELMET_HSTS_MAX_AGE=31536000
ENV DISMISSIBLE_HELMET_HSTS_INCLUDE_SUBDOMAINS=true
ENV DISMISSIBLE_HELMET_HSTS_PRELOAD=false

# CORS
ENV DISMISSIBLE_CORS_ENABLED=true
ENV DISMISSIBLE_CORS_ORIGINS=""
ENV DISMISSIBLE_CORS_METHODS="GET,POST,DELETE,OPTIONS"
ENV DISMISSIBLE_CORS_ALLOWED_HEADERS="Content-Type,Authorization,x-request-id"
ENV DISMISSIBLE_CORS_CREDENTIALS=true
ENV DISMISSIBLE_CORS_MAX_AGE=86400

# Validation Settings
ENV DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES=true
ENV DISMISSIBLE_VALIDATION_WHITELIST=true
ENV DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED=true
ENV DISMISSIBLE_VALIDATION_TRANSFORM=true

# Expose the port
EXPOSE ${DISMISSIBLE_PORT}

# Health check - uses shell to read DISMISSIBLE_PORT at runtime, not build time
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD sh -c 'wget --no-verbose --tries=1 --spider http://localhost:${DISMISSIBLE_PORT}/health || exit 1'

# Start the application (entrypoint script handles migrations if enabled)
CMD ["/app/docker-entrypoint.sh"]
