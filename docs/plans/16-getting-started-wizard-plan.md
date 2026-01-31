# Implementation Plan: Getting Started Wizard

**Status**: ✅ Implementation Complete (pending production deployment)
**Last Updated**: 2026-02-01

> **Note**: This plan has been updated to reflect the actual implementation. Items marked with [ ] are complete. Additional features beyond the original plan are documented in the "Key Features Implemented Beyond Original Plan" section.

## Overview

Create a client-side interactive wizard that guides developers through configuring the Dismissible API. The wizard will generate `.env` files and `docker run` commands based on user selections. It must run entirely in the browser with no server communication, deployable to https://dismissible.io/ and runnable locally.

## Key Features Implemented Beyond Original Plan

The following features were added during development that weren't in the original specification:

### 1. Shareable Configuration URLs
- Complete wizard state can be encoded in a URL using base64url encoding
- "Copy share URL" button on the Review step allows easy sharing of configurations
- URLs are parsed and validated on page load to restore saved configurations
- Security features: size limits, prototype pollution protection, Zod schema validation

### 2. Enhanced Security
- **Shell injection protection**: All docker command values are properly escaped
- **Env file injection protection**: Values with special characters are automatically quoted and escaped
- **Prototype pollution prevention**: Deep filtering of dangerous keys (__proto__, constructor, prototype)
- Comprehensive input sanitization throughout

### 3. Improved UX Components
- **StepHeader**: Consistent header component used across all wizard steps
- **CopyButton**: Reusable copy-to-clipboard button with visual feedback
- **AlertBox**: Info/warning/error alert boxes for user guidance
- **StepIndicator**: Visual progress indicator with step names
- **FormField**: Wrapper component for consistent form field layout

### 4. Design Decisions
- **No password masking in output**: All values (including secrets) are shown in plaintext in generated output for developer convenience
- **Sensitive data protection in UI only**: Connection strings and credentials are masked (***) in the Review step summary, but shown fully in generated output
- **Default value toggle applies to .env only**: Docker commands always include all values for clarity

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
- [ ] Install dependencies:
  - Tailwind CSS for styling
  - Headless UI for accessible components
  - Heroicons for icons
  - Zod for schema validation
  - Native clipboard API (no external library needed)
- [ ] Set up Tailwind CSS configuration with custom dark theme
- [ ] Create project structure:
  ```
  wizard/
  ├── src/
  │   ├── components/     # UI components (forms, layout, etc.)
  │   ├── config/         # Configuration schema and defaults
  │   ├── steps/          # Wizard step components
  │   ├── hooks/          # React hooks (useWizardState)
  │   ├── utils/          # Helper functions (generators, validators, escaping)
  │   ├── App.tsx
  │   └── main.tsx
  ├── public/
  ├── index.html
  ├── package.json
  ├── tsconfig.json
  ├── tailwind.config.js
  ├── postcss.config.js
  ├── vite.config.ts
  └── README.md
  ```

#### 1.2 Define Configuration Schema

- [ ] Create TypeScript types/interfaces for all configuration options based on `docs/CONFIGURATION.md`:
  - `CoreConfig`
  - `StorageConfig` (with discriminated union types for Postgres/DynamoDB/Memory)
  - `CacheConfig` (with discriminated union types for Redis/Memory/None)
  - `SwaggerConfig`
  - `JwtAuthConfig`
  - `CorsConfig`
  - `HelmetConfig`
  - `ValidationConfig`
  - `RateLimiterConfig`
- [ ] Create a `WizardConfig` type that combines all sections
- [ ] Define default values matching `docs/CONFIGURATION.md`
- [ ] Use Zod schemas for runtime validation and type safety
- [ ] Create constants file with:
  - Environment variable names
  - Default values
  - Help text/descriptions from CONFIGURATION.md
  - Field metadata and labels

File locations:
- `wizard/src/config/schema.ts` (Zod schemas and types)
- `wizard/src/config/defaults.ts` (default configuration)
- `wizard/src/config/constants.ts` (env var names and metadata)

### Phase 2: Core Wizard UI

#### 2.1 Create Wizard Shell

- [ ] Build main wizard container component with:
  - Progress indicator (step X of Y)
  - Navigation buttons (Previous, Next)
  - State management for current step
  - State management for user selections
  - "Start Over" button on final step
- [ ] Implement step navigation logic:
  - Forward/backward navigation
  - Preserve answers when navigating
  - Validate current step before proceeding
  - Direct navigation to any step (for edit buttons)
- [ ] Create responsive layout (mobile + desktop)
- [ ] Full ARIA accessibility attributes

File location: `wizard/src/components/WizardShell.tsx`

#### 2.2 Build Reusable Form Components

- [ ] `TextInput` - for strings (ports, URLs, prefixes)
- [ ] `NumberInput` - for numeric values (TTL, max items, timeouts)
- [ ] `SelectInput` - for enum choices (storage type, cache type)
- [ ] `ToggleInput` - for boolean values (enable/disable)
- [ ] `MultiSelectInput` - for comma-separated lists (CORS origins, allowed headers)
- [ ] `PasswordInput` - for sensitive values (connection strings, secrets) with show/hide toggle
- [ ] `HelpTooltip` - for inline help text from CONFIGURATION.md
- [ ] `FormField` - wrapper component for consistent field layout

Each component:

- Accepts `value`, `onChange`, `label`, `helpText`, `required` props
- Shows validation errors
- Supports default values
- Fully accessible with ARIA attributes

Additional UI components created:

- [ ] `StepHeader` - consistent header for each wizard step
- [ ] `CopyButton` - reusable copy-to-clipboard button with feedback
- [ ] `AlertBox` - info/warning/error alert boxes
- [ ] `StepIndicator` - progress indicator showing current step

File location: `wizard/src/components/`

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
  - Algorithms (`DISMISSIBLE_JWT_AUTH_ALGORITHMS`) - text input (comma-separated)
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
  - Origins (`DISMISSIBLE_CORS_ORIGINS`) - text input (comma-separated)
  - Methods (`DISMISSIBLE_CORS_METHODS`) - text input (comma-separated)
  - Allowed headers (`DISMISSIBLE_CORS_ALLOWED_HEADERS`) - text input (comma-separated)
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
  - Ignored keys (`DISMISSIBLE_RATE_LIMITER_IGNORED_KEYS`) - text input (comma-separated)
  - Priority (`DISMISSIBLE_RATE_LIMITER_PRIORITY`)

File: `wizard/src/steps/RateLimiterStep.tsx`

#### 3.10 Step 10: Review Summary

- [ ] Display all selected configuration values grouped by section
- [ ] Clickable edit buttons to return to any previous step
- [ ] "Copy share URL" button to share configuration
- [ ] Sensitive values masked in review (e.g., connection strings show as ***)
- [ ] Integrated OutputDisplay component (no separate "Generate" step needed)

File: `wizard/src/steps/ReviewStep.tsx`

### Phase 4: Output Generation

#### 4.1 .env File Generator

- [ ] Create utility function to generate `.env` file content:
  - Iterate through all config values
  - Format as `KEY=value`
  - Group by section with comment headers
  - Toggle to include/exclude default values
  - Secure .env value escaping (quotes special characters, prevents injection)
  - Values always shown in plaintext (no masking)
- [ ] Add download functionality (blob + download link)
- [ ] Add copy-to-clipboard functionality

File: `wizard/src/utils/envGenerator.ts`

#### 4.2 docker run Command Generator

- [ ] Create utility function to generate `docker run` command:
  - Start with base: `docker run -d --name dismissible-api -p {PORT}:3001 dismissibleio/dismissible-api:latest`
  - Add `-e KEY=value` for each configured variable
  - Always includes all configured values (no default toggle)
  - Format for readability (line breaks with `\`)
  - Secure shell escaping to prevent injection attacks
- [ ] Add copy-to-clipboard functionality

File: `wizard/src/utils/dockerGenerator.ts`

#### 4.3 Output Display Component

- [ ] Create output page/step with tabs or sections:
  - `.env` file content (with download + copy buttons)
  - `docker run` command (with copy button)
  - Toggle to show/hide default values (affects .env file only)
  - No password masking - all values shown in plaintext for usability
- [ ] Add "Start Over" button to reset wizard (in WizardShell on last step)

File: `wizard/src/components/OutputDisplay.tsx`

#### 4.4 Shareable Configuration URLs

- [ ] Create utility to encode/decode wizard configuration in URLs:
  - Base64url encoding for URL safety (no +, /, or padding)
  - Encode entire config as query parameter `?wizard=<base64>`
  - Parse and restore config from URL on page load
  - Security features:
    - Size limits (4000 char encoded, 16KB decoded)
    - Prototype pollution protection
    - Schema validation with Zod
    - Sanitization of unknown keys
  - Handle URL corruption (e.g., spaces from + in query strings)
- [ ] Add "Copy share URL" button to Review step
- [ ] Auto-restore configuration from URL parameter on wizard load

File: `wizard/src/utils/shareUrl.ts`

#### 4.5 Security Utilities

- [ ] Shell value escaping for docker commands:
  - Escape: $ ` \ " ! newlines and carriage returns
  - Prevents command injection in docker run commands
- [ ] .env value escaping:
  - Auto-quote values with special characters
  - Escape backslashes, quotes, newlines
  - Leave simple alphanumeric values unquoted
- [ ] Prototype pollution protection:
  - Filter dangerous keys (__proto__, constructor, prototype)
  - Deep safe copy function for nested objects
  - Used in URL parsing and config restoration

File: `wizard/src/utils/escaping.ts`

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

## Implementation Status

### Completed (All Core Features)

All phases from the original plan have been completed:

- ✅ **Phase 1**: Project setup with Vite + React + TypeScript + Tailwind
- ✅ **Phase 2**: Core wizard UI with navigation and form components
- ✅ **Phase 3**: All 10 wizard steps implemented with conditional logic
- ✅ **Phase 4**: Output generation (.env, docker, shareable URLs)
- ✅ **Phase 5**: Polish & UX (validation, help text, responsive design, state management)
- ✅ **Phase 6**: Testing & documentation (README, inline help)
- ⏸️ **Phase 7**: Deployment (pending GitHub Pages / hosting setup)

### Additional Work Beyond Plan

- ✅ Shareable URLs with base64 encoding
- ✅ Enhanced security utilities (escaping, prototype pollution protection)
- ✅ Additional UI components (StepHeader, CopyButton, AlertBox)
- ✅ Zod schema validation for runtime type safety
- ✅ URL state restoration with validation

## Future Enhancements (Out of Scope)

- [ ] Generate `docker-compose.yml` output
- [ ] Generate `.env.yaml` output (for NestJS module users)
- [ ] Import existing `.env` file to pre-populate wizard
- [ ] "Quick Start" templates (dev, production, AWS, GCP, etc.)
- [ ] Dark mode toggle (currently dark theme only)
- [ ] Internationalization (i18n) for multiple languages
- [ ] Analytics (privacy-respecting, opt-in only)
- [ ] LocalStorage persistence (currently URL-based sharing only)

## Success Criteria

- [ ] Wizard runs entirely in the browser with no server dependencies
- [ ] All configuration options from `docs/CONFIGURATION.md` are supported
- [ ] Generated `.env` files are valid and can be used directly
- [ ] Generated `docker run` commands are valid and can be executed directly
- [ ] Wizard is deployed to https://dismissible.io/ and accessible online *(pending)*
- [ ] Wizard can be run locally without internet connection
- [ ] Responsive design works on mobile, tablet, and desktop
- [ ] Documentation is clear and complete (README.md included)
- [ ] **Bonus**: Shareable configuration URLs for easy collaboration

## Estimated vs Actual Effort

### Original Estimate

- Phase 1 (Setup): 2-4 hours
- Phase 2 (Core UI): 4-6 hours
- Phase 3 (Steps): 8-12 hours (1-1.5 hours per step)
- Phase 4 (Output): 4-6 hours
- Phase 5 (Polish): 4-6 hours
- Phase 6 (Testing): 4-6 hours
- Phase 7 (Deployment): 2-4 hours

**Original Total: 28-44 hours**

### Additional Work

- Shareable URLs feature: ~4-6 hours
- Security utilities (escaping, validation): ~3-4 hours
- Additional UI components: ~2-3 hours

**Note**: The wizard implementation is complete and functional. Deployment to production hosting is the only remaining task.
