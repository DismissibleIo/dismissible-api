# Implementation Plan: Getting Started Wizard

## Overview

Create a client-side interactive wizard that guides developers through configuring the Dismissible API. The wizard will generate `.env` files and `docker run` commands based on user selections. It must run entirely in the browser with no server communication, deployable to https://dismissible.io/ and runnable locally.

## Technology Decisions

### Framework Choice

**Recommendation: Vite + React + TypeScript**

Rationale:

- Fast dev server and build times
- Can be built as a single-page static site
- TypeScript provides type safety for configuration schema
- React ecosystem has good UI component libraries
- Easy to deploy to GitHub Pages, Cloudflare Pages, or Vercel
- Can be run locally with `npm run dev` or served as static files

### UI Component Library

**Recommendation: Tailwind CSS + Headless UI or shadcn/ui**

Rationale:

- Lightweight and customizable
- Good mobile responsiveness out of the box
- No heavy framework dependencies
- Easy to create step-based forms

### Repository Location

**Recommendation: `wizard/`**

Rationale:

- Follows the monorepo pattern if using NX/Turborepo
- Keeps wizard separate from API code
- Easy to deploy independently

## Implementation Steps

### Phase 1: Project Setup

#### 1.1 Initialize Wizard App

- [ ] Create `wizard/` directory structure
- [ ] Initialize Vite + React + TypeScript project
  ```bash
  npm create vite@latest apps/wizard -- --template react-ts
  ```
- [ ] Install dependencies:
  - Tailwind CSS for styling
  - React Router (if multi-page) or state management for steps
  - `copy-to-clipboard` or similar for clipboard functionality
- [ ] Set up Tailwind CSS configuration
- [ ] Create basic project structure:
  ```
  wizard/
  ├── src/
  │   ├── components/     # UI components
  │   ├── config/         # Configuration schema and defaults
  │   ├── steps/          # Wizard step components
  │   ├── utils/          # Helper functions (generators, validators)
  │   ├── App.tsx
  │   └── main.tsx
  ├── public/
  ├── index.html
  ├── package.json
  ├── tsconfig.json
  ├── vite.config.ts
  └── README.md
  ```

#### 1.2 Define Configuration Schema

- [ ] Create TypeScript types/interfaces for all configuration options based on `docs/CONFIGURATION.md`:
  - `CoreConfig`
  - `StorageConfig` (with union types for Postgres/DynamoDB/Memory)
  - `CacheConfig` (with union types for Redis/Memory/None)
  - `SwaggerConfig`
  - `JwtAuthConfig`
  - `CorsConfig`
  - `HelmetConfig`
  - `ValidationConfig`
  - `RateLimiterConfig`
- [ ] Create a `WizardConfig` type that combines all sections
- [ ] Define default values matching `docs/CONFIGURATION.md`
- [ ] Create a constants file with:
  - Environment variable names
  - Default values
  - Help text/descriptions from CONFIGURATION.md
  - Validation rules (required fields, formats)

File location: `wizard/src/config/schema.ts`

### Phase 2: Core Wizard UI

#### 2.1 Create Wizard Shell

- [ ] Build main wizard container component with:
  - Progress indicator (step X of Y)
  - Navigation buttons (Previous, Next, Review)
  - State management for current step
  - State management for user selections
- [ ] Implement step navigation logic:
  - Forward/backward navigation
  - Preserve answers when navigating
  - Validate current step before proceeding
- [ ] Create responsive layout (mobile + desktop)

File location: `wizard/src/components/WizardShell.tsx`

#### 2.2 Build Reusable Form Components

- [ ] `TextInput` - for strings (ports, URLs, prefixes)
- [ ] `NumberInput` - for numeric values (TTL, max items, timeouts)
- [ ] `SelectInput` - for enum choices (storage type, cache type)
- [ ] `ToggleInput` - for boolean values (enable/disable)
- [ ] `MultiSelectInput` - for comma-separated lists (CORS origins, allowed headers)
- [ ] `PasswordInput` - for sensitive values (connection strings, secrets) with show/hide toggle
- [ ] `HelpTooltip` - for inline help text from CONFIGURATION.md

Each component should:

- Accept a `value`, `onChange`, `label`, `helpText`, `required` props
- Show validation errors
- Support default values

File location: `wizard/src/components/forms/`

### Phase 3: Wizard Steps Implementation

Implement each step as a separate component that renders the appropriate form fields:

#### 3.1 Step 1: Core Settings

- [ ] Port (`DISMISSIBLE_PORT`)
- [ ] Storage type (`DISMISSIBLE_STORAGE_TYPE`) - select: postgres, dynamodb, memory
- [ ] Run setup (`DISMISSIBLE_STORAGE_RUN_SETUP`) - toggle

File: `wizard/src/steps/CoreStep.tsx`

#### 3.2 Step 2: Storage Configuration

- [ ] Conditional rendering based on storage type selected in Step 1
- [ ] **If Postgres**:
  - Connection string (`DISMISSIBLE_STORAGE_POSTGRES_CONNECTION_STRING`) - password input with help text showing example format
- [ ] **If DynamoDB**:
  - Table name (`DISMISSIBLE_STORAGE_DYNAMODB_TABLE_NAME`)
  - AWS region (`DISMISSIBLE_STORAGE_DYNAMODB_AWS_REGION`)
  - Access key ID (`DISMISSIBLE_STORAGE_DYNAMODB_AWS_ACCESS_KEY_ID`) - password input
  - Secret access key (`DISMISSIBLE_STORAGE_DYNAMODB_AWS_SECRET_ACCESS_KEY`) - password input
  - Session token (`DISMISSIBLE_STORAGE_DYNAMODB_AWS_SESSION_TOKEN`) - password input, optional
  - Endpoint (`DISMISSIBLE_STORAGE_DYNAMODB_ENDPOINT`) - optional
- [ ] **If Memory**:
  - Max items (`DISMISSIBLE_STORAGE_MEMORY_MAX_ITEMS`)
  - TTL milliseconds (`DISMISSIBLE_STORAGE_MEMORY_TTL_MS`)

File: `wizard/src/steps/StorageStep.tsx`

#### 3.3 Step 3: Cache Configuration

- [ ] Enable cache toggle
- [ ] Cache type (`DISMISSIBLE_CACHE_TYPE`) - select: redis, memory, or none
- [ ] **If Redis**:
  - URL (`DISMISSIBLE_CACHE_REDIS_URL`) - password input
  - Key prefix (`DISMISSIBLE_CACHE_REDIS_KEY_PREFIX`)
  - TTL milliseconds (`DISMISSIBLE_CACHE_REDIS_TTL_MS`)
  - Enable ready check (`DISMISSIBLE_CACHE_REDIS_ENABLE_READY_CHECK`)
  - Max retries (`DISMISSIBLE_CACHE_REDIS_MAX_RETRIES`)
  - Connection timeout milliseconds (`DISMISSIBLE_CACHE_REDIS_CONNECTION_TIMEOUT_MS`)
- [ ] **If Memory**:
  - Max items (`DISMISSIBLE_CACHE_MEMORY_MAX_ITEMS`)
  - TTL milliseconds (`DISMISSIBLE_CACHE_MEMORY_TTL_MS`)

File: `wizard/src/steps/CacheStep.tsx`

#### 3.4 Step 4: Swagger Configuration

- [ ] Enable Swagger (`DISMISSIBLE_SWAGGER_ENABLED`) - toggle
- [ ] Swagger path (`DISMISSIBLE_SWAGGER_PATH`)
- [ ] Help text explaining the paths (e.g., `/docs`, `/docs-json`, `/docs-yaml`)

File: `wizard/src/steps/SwaggerStep.tsx`

#### 3.5 Step 5: JWT Authentication

- [ ] Enable JWT auth (`DISMISSIBLE_JWT_AUTH_ENABLED`) - toggle
- [ ] **If enabled**:
  - Well-known URL (`DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL`) - required if enabled
  - Issuer (`DISMISSIBLE_JWT_AUTH_ISSUER`)
  - Audience (`DISMISSIBLE_JWT_AUTH_AUDIENCE`)
  - Algorithms (`DISMISSIBLE_JWT_AUTH_ALGORITHMS`) - multi-select or text input
  - JWKS cache duration (`DISMISSIBLE_JWT_AUTH_JWKS_CACHE_DURATION`)
  - Request timeout (`DISMISSIBLE_JWT_AUTH_REQUEST_TIMEOUT`)
  - Priority (`DISMISSIBLE_JWT_AUTH_PRIORITY`)
  - Match user ID (`DISMISSIBLE_JWT_AUTH_MATCH_USER_ID`) - toggle
  - User ID claim (`DISMISSIBLE_JWT_AUTH_USER_ID_CLAIM`)
  - User ID match type (`DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_TYPE`) - select: exact, substring, regex
  - **If regex**: User ID match regex (`DISMISSIBLE_JWT_AUTH_USER_ID_MATCH_REGEX`) - required if match type is regex

File: `wizard/src/steps/JwtAuthStep.tsx`

#### 3.6 Step 6: CORS Configuration

- [ ] Enable CORS (`DISMISSIBLE_CORS_ENABLED`) - toggle
- [ ] **If enabled**:
  - Origins (`DISMISSIBLE_CORS_ORIGINS`) - comma-separated list
  - Methods (`DISMISSIBLE_CORS_METHODS`) - comma-separated list
  - Allowed headers (`DISMISSIBLE_CORS_ALLOWED_HEADERS`) - comma-separated list
  - Credentials (`DISMISSIBLE_CORS_CREDENTIALS`) - toggle
  - Max age (`DISMISSIBLE_CORS_MAX_AGE`)

File: `wizard/src/steps/CorsStep.tsx`

#### 3.7 Step 7: Security Headers (Helmet)

- [ ] Enable Helmet (`DISMISSIBLE_HELMET_ENABLED`) - toggle
- [ ] **If enabled**:
  - CSP (`DISMISSIBLE_HELMET_CSP`) - toggle
  - COEP (`DISMISSIBLE_HELMET_COEP`) - toggle
  - HSTS max age (`DISMISSIBLE_HELMET_HSTS_MAX_AGE`)
  - HSTS include subdomains (`DISMISSIBLE_HELMET_HSTS_INCLUDE_SUBDOMAINS`) - toggle
  - HSTS preload (`DISMISSIBLE_HELMET_HSTS_PRELOAD`) - toggle

File: `wizard/src/steps/HelmetStep.tsx`

#### 3.8 Step 8: Validation Settings

- [ ] Disable error messages (`DISMISSIBLE_VALIDATION_DISABLE_ERROR_MESSAGES`) - toggle
- [ ] Whitelist (`DISMISSIBLE_VALIDATION_WHITELIST`) - toggle
- [ ] Forbid non-whitelisted (`DISMISSIBLE_VALIDATION_FORBID_NON_WHITELISTED`) - toggle
- [ ] Transform (`DISMISSIBLE_VALIDATION_TRANSFORM`) - toggle

File: `wizard/src/steps/ValidationStep.tsx`

#### 3.9 Step 9: Rate Limiter Configuration

- [ ] Enable rate limiter (`DISMISSIBLE_RATE_LIMITER_ENABLED`) - toggle
- [ ] **If enabled**:
  - Points (`DISMISSIBLE_RATE_LIMITER_POINTS`)
  - Duration (`DISMISSIBLE_RATE_LIMITER_DURATION`)
  - Block duration (`DISMISSIBLE_RATE_LIMITER_BLOCK_DURATION`)
  - Key type (`DISMISSIBLE_RATE_LIMITER_KEY_TYPE`) - multi-select: ip, origin, referrer
  - Key mode (`DISMISSIBLE_RATE_LIMITER_KEY_MODE`) - select: and, or, any
  - Ignored keys (`DISMISSIBLE_RATE_LIMITER_IGNORED_KEYS`) - comma-separated list
  - Priority (`DISMISSIBLE_RATE_LIMITER_PRIORITY`)

File: `wizard/src/steps/RateLimiterStep.tsx`

#### 3.10 Step 10: Review Summary

- [ ] Display all selected configuration values grouped by section
- [ ] Show which values differ from defaults (highlight or badge)
- [ ] Allow user to go back and edit any step
- [ ] "Generate Configuration" button to proceed to output

File: `wizard/src/steps/ReviewStep.tsx`

### Phase 4: Output Generation

#### 4.1 .env File Generator

- [ ] Create utility function to generate `.env` file content:
  - Iterate through all config values
  - Format as `KEY=value`
  - Include comments for default values (e.g., `# Default: 3001`)
  - Group by section with comment headers
  - Handle sensitive values (mask or include as-is based on user preference)
- [ ] Add download functionality (blob + download link)
- [ ] Add copy-to-clipboard functionality

File: `wizard/src/utils/envGenerator.ts`

#### 4.2 docker run Command Generator

- [ ] Create utility function to generate `docker run` command:
  - Start with base: `docker run -d -p {PORT}:3001 dismissibleio/dismissible-api`
  - Add `-e KEY=value` for each configured variable
  - Optionally omit default values (with toggle)
  - Format for readability (line breaks with `\`)
  - Handle sensitive values (mask or include as-is based on user preference)
- [ ] Add copy-to-clipboard functionality

File: `wizard/src/utils/dockerGenerator.ts`

#### 4.3 Output Display Component

- [ ] Create output page/step with tabs or sections:
  - `.env` file content (with download + copy buttons)
  - `docker run` command (with copy button)
  - Toggle to show/hide default values
  - Toggle to show/hide sensitive values (mask with `***`)
- [ ] Add "Start Over" button to reset wizard

File: `wizard/src/components/OutputDisplay.tsx`

### Phase 5: Polish & UX

#### 5.1 Validation & Error Handling

- [ ] Add field-level validation:
  - Required fields
  - Format validation (URLs, connection strings, numbers)
  - Regex patterns where applicable
- [ ] Show validation errors inline
- [ ] Prevent navigation to next step if current step is invalid
- [ ] Add validation to Review step (final check)

#### 5.2 Help Text & Documentation

- [ ] Extract all descriptions from `docs/CONFIGURATION.md`
- [ ] Add tooltips/help icons for each field
- [ ] Link to relevant sections in CONFIGURATION.md (external link)
- [ ] Add examples for complex fields (connection strings, regex patterns)

#### 5.3 Responsive Design

- [ ] Test and optimize for mobile (< 768px)
- [ ] Test and optimize for tablet (768px - 1024px)
- [ ] Test and optimize for desktop (> 1024px)
- [ ] Ensure form inputs are touch-friendly on mobile

#### 5.4 Progress Indicator

- [ ] Visual step indicator (1 of 10, 2 of 10, etc.)
- [ ] Breadcrumb or stepper component showing all steps
- [ ] Mark completed steps
- [ ] Allow clicking on completed steps to navigate back

#### 5.5 State Persistence (Optional Enhancement)

- [ ] Save wizard state to localStorage
- [ ] Restore state on page refresh
- [ ] Add "Clear" button to reset localStorage
- [ ] Show warning before clearing

### Phase 6: Testing & Documentation

#### 6.1 Testing

- [ ] Manual testing of all wizard flows:
  - All storage types (Postgres, DynamoDB, Memory)
  - All cache types (Redis, Memory, None)
  - JWT auth enabled/disabled with all match types
  - Rate limiter with different key types and modes
- [ ] Test output generation:
  - Verify `.env` file format
  - Verify `docker run` command is valid
  - Test with defaults only
  - Test with all custom values
- [ ] Test clipboard functionality (different browsers)
- [ ] Test download functionality (different browsers)
- [ ] Test on different devices and screen sizes

#### 6.2 Documentation

- [ ] Create `wizard/README.md` with:
  - Overview of the wizard
  - Local development instructions
  - Build instructions
  - Deployment instructions
  - Architecture overview
- [ ] Add comments to complex code sections
- [ ] Document the configuration schema

### Phase 7: Deployment

#### 7.1 Build Configuration

- [ ] Configure Vite build for production:
  - Optimize bundle size
  - Configure base path for deployment
  - Ensure static assets are properly referenced
- [ ] Test production build locally

#### 7.2 Hosting Setup

**Recommendation: GitHub Pages or Cloudflare Pages**

- [ ] Choose hosting platform GitHub Pages
- [ ] Set up deployment workflow:
  - GitHub Actions for automated builds
  - Deploy on push to main branch
  - Deploy preview for pull requests (optional)

#### 7.3 Local Distribution

- [ ] Document how to run locally:
  - Clone repo and run `npm run wizard` in `wizard/`
  - Or: Serve `dist/` folder with any static server after build
- [ ] Consider creating an npx command (optional):
  - Package as npm module
  - Add binary script to launch local server
  - Publish to npm as `@dismissible/wizard` or similar

## Future Enhancements (Out of Scope)

- [ ] Generate `docker-compose.yml` output
- [ ] Generate `.env.yaml` output (for NestJS module users)
- [ ] Import existing `.env` file to pre-populate wizard
- [ ] "Quick Start" templates (dev, production, AWS, GCP, etc.)
- [ ] Dark mode toggle
- [ ] Internationalization (i18n) for multiple languages
- [ ] Analytics (privacy-respecting, opt-in only)

## Success Criteria

- [ ] Wizard runs entirely in the browser with no server dependencies
- [ ] All configuration options from `docs/CONFIGURATION.md` are supported
- [ ] Generated `.env` files are valid and can be used directly
- [ ] Generated `docker run` commands are valid and can be executed directly
- [ ] Wizard is deployed to https://dismissible.io/ and accessible online
- [ ] Wizard can be run locally without internet connection
- [ ] Responsive design works on mobile, tablet, and desktop
- [ ] Documentation is clear and complete

## Estimated Effort

- Phase 1 (Setup): 2-4 hours
- Phase 2 (Core UI): 4-6 hours
- Phase 3 (Steps): 8-12 hours (1-1.5 hours per step)
- Phase 4 (Output): 4-6 hours
- Phase 5 (Polish): 4-6 hours
- Phase 6 (Testing): 4-6 hours
- Phase 7 (Deployment): 2-4 hours

**Total: 28-44 hours**
