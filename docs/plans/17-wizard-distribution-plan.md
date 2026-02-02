# Implementation Plan: Wizard Distribution

**Status**: 📋 Planning
**Last Updated**: 2026-02-02

## Overview

Enable two distribution methods for the Dismissible configuration wizard:

1. **Hosted version** at `wizard.dismissible.io` - for users who want quick access
2. **Local CLI** via `npx @dismissible/wizard` - for users who want to run locally (e.g., to avoid sharing secrets over the network)

Both methods serve the same wizard UI, just with different delivery mechanisms.

## Goals

- Users can access the wizard at `https://wizard.dismissible.io` without any setup
- Users can run `npx @dismissible/wizard` to launch the wizard locally
- The CLI should work offline after initial download
- Minimal maintenance burden - both use the same built wizard assets
- Clear documentation for both options

## Distribution Strategy

### Option 1: wizard.dismissible.io (Static Hosting)

The wizard is a static React app deployed via Render (consistent with the main dismissible.io website).

**Hosting: Render Static Site**

Rationale:
- Already used for dismissible.io website and API
- Consistent infrastructure and deployment patterns
- Domain already configured
- Auto-deploy on commit via render.yaml

### Option 2: npx @dismissible/wizard (CLI Package)

Add CLI functionality to the existing wizard package that:
1. Contains the pre-built wizard static assets
2. Starts a local HTTP server
3. Opens the wizard in the user's default browser

This allows users concerned about security to run everything locally - no secrets ever leave their machine.

**Why not a separate CLI package?**

The CLI is incorporated directly into the existing `wizard/` project because:
- Keeps all wizard code in one place
- Shares the same version number
- Build output is already in the right location
- Reduces maintenance overhead
- Simpler npm publishing workflow

## Implementation Steps

### Phase 1: Prepare Wizard Build for Distribution

#### 1.1 Update Vite Configuration

- [ ] Configure `base` path for flexible deployment:
  - Use `./` for relative paths (works in both hosted and local contexts)
- [ ] Ensure all assets are properly bundled (no external CDN dependencies)
- [ ] Verify build works with `NX_DAEMON=false npx nx build wizard`

#### 1.2 Verify Build Output

- [ ] Build outputs to `dist/wizard/`
- [ ] All assets are self-contained
- [ ] No hardcoded localhost or domain references
- [ ] Test serving with `npx serve dist/wizard` works correctly

### Phase 2: Static Hosting Deployment (wizard.dismissible.io)

#### 2.1 Create render.yaml

Create `wizard/render.yaml` for Render deployment. This will be used as a separate Blueprint in Render for the wizard static site.

```yaml
# Render Blueprint for Dismissible Configuration Wizard
# https://render.com/docs/infrastructure-as-code
#
# To deploy:
# 1. Connect this repo to Render via Dashboard > New > Blueprint
# 2. Set the root directory to "wizard"
# 3. Render will automatically deploy on pushes to your linked branch

services:
  - type: web
    name: dismissible-wizard
    runtime: static
    buildCommand: cd .. && npm ci && NX_DAEMON=false npx nx build wizard
    staticPublishPath: ../dist/wizard
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    headers:
      - path: /*
        name: X-Frame-Options
        value: DENY
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
      - path: /*
        name: X-XSS-Protection
        value: "1; mode=block"
      - path: /*
        name: Referrer-Policy
        value: strict-origin-when-cross-origin
```

> **Note**: Custom domain (`wizard.dismissible.io`) is configured in the Render dashboard after the initial deployment.

#### 2.2 GitHub Actions Workflow (Build Verification)

Create a GitHub Action to verify the wizard builds successfully. Render handles the actual deployment via its GitHub integration.

```yaml
# .github/workflows/wizard-build.yml
name: Wizard Build

on:
  push:
    branches: [main]
    paths:
      - 'wizard/**'
      - '.github/workflows/wizard-build.yml'
  pull_request:
    paths:
      - 'wizard/**'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Build wizard
        run: NX_DAEMON=false npx nx build wizard
      
      - name: Verify build output
        run: |
          test -f dist/wizard/index.html || (echo "Missing index.html" && exit 1)
          echo "Build output verified successfully"
```

#### 2.3 Verify Deployment

- [ ] Wizard loads correctly at `wizard.dismissible.io`
- [ ] All styles and functionality work
- [ ] Share URLs work with the new domain
- [ ] HTTPS is properly configured (handled by Render)

### Phase 3: Add CLI to Existing Wizard Package (@dismissible/wizard)

The CLI functionality is added directly to the existing `wizard/` project rather than creating a separate package. This keeps all wizard-related code together and simplifies maintenance.

#### 3.1 Add CLI Files to Wizard Project

Add the following files to the existing wizard project:

```
wizard/
├── bin/
│   └── cli.mjs           # Entry point with shebang
├── cli/
│   └── server.ts         # CLI server logic
├── src/                  # Existing React app source
├── package.json          # Updated with bin and CLI deps
└── ...
```

#### 3.2 Implement CLI Server

**wizard/bin/cli.mjs** (entry point):
```javascript
#!/usr/bin/env node
import { startWizard } from '../cli/server.js';
startWizard();
```

**wizard/cli/server.ts** (server logic):
```typescript
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

export async function startWizard(options: { port?: number } = {}) {
  const port = options.port ?? 3456;
  // When published, dist is at ../dist relative to cli/server.js
  const distPath = join(__dirname, '../dist');

  if (!existsSync(distPath)) {
    console.error('Error: Wizard assets not found at', distPath);
    console.error('The package may be corrupted or not built correctly.');
    process.exit(1);
  }

  const server = createServer((req, res) => {
    const urlPath = req.url?.split('?')[0] ?? '/';
    let filePath = join(distPath, urlPath === '/' ? 'index.html' : urlPath);
    
    // Handle SPA routing - serve index.html for non-file requests
    if (!existsSync(filePath) || !extname(filePath)) {
      filePath = join(distPath, 'index.html');
    }

    try {
      const content = readFileSync(filePath);
      const ext = extname(filePath);
      res.writeHead(200, { 
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`
┌───────────────────────────────────────────────────────────┐
│                                                           │
│   Dismissible Configuration Wizard                        │
│                                                           │
│   Running locally at: ${url.padEnd(32)} │
│                                                           │
│   Press Ctrl+C to stop                                    │
│                                                           │
└───────────────────────────────────────────────────────────┘
`);
    open(url);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down wizard...');
    server.close();
    process.exit(0);
  });
}
```

#### 3.3 Update Package Configuration

Update **wizard/package.json**:
```json
{
  "name": "@dismissible/wizard",
  "version": "1.0.0",
  "description": "Configuration wizard for Dismissible API - generates .env files and docker commands",
  "keywords": ["dismissible", "api", "configuration", "wizard", "docker", "env"],
  "license": "MIT",
  "author": "Dismissible",
  "repository": {
    "type": "git",
    "url": "https://github.com/dismissibleio/dismissible-api.git",
    "directory": "wizard"
  },
  "homepage": "https://wizard.dismissible.io",
  "type": "module",
  "bin": {
    "dismissible-wizard": "./bin/cli.mjs"
  },
  "files": [
    "bin",
    "cli",
    "dist"
  ],
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:cli": "tsc -p tsconfig.cli.json",
    "build:all": "npm run build && npm run build:cli",
    "preview": "vite preview",
    "prepublishOnly": "npm run build:all"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.2",
    "zod": "^3.24.1",
    "@hookform/resolvers": "^3.9.1",
    "@headlessui/react": "^2.2.0",
    "@heroicons/react": "^2.2.0",
    "open": "^10.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.9.3",
    "vite": "^6.0.7",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 3.4 Add CLI TypeScript Configuration

Create **wizard/tsconfig.cli.json**:
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "outDir": "./cli",
    "rootDir": "./cli",
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["cli/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

#### 3.5 Update Nx Project Configuration

Update **wizard/project.json** to add CLI-related targets:
```json
{
  "name": "wizard",
  "$schema": "../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "wizard/src",
  "projectType": "application",
  "tags": [],
  "targets": {
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{workspaceRoot}/dist/wizard"],
      "options": {
        "outputPath": "dist/wizard",
        "configFile": "wizard/vite.config.ts"
      }
    },
    "build-cli": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc -p tsconfig.cli.json",
        "cwd": "wizard"
      }
    },
    "build-package": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "NX_DAEMON=false npx nx build wizard",
          "NX_DAEMON=false npx nx build-cli wizard",
          "rm -rf wizard/dist && cp -r dist/wizard wizard/dist"
        ],
        "parallel": false
      }
    },
    "publish": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npm publish --access public",
        "cwd": "wizard"
      },
      "dependsOn": ["build-package"]
    },
    "serve": {
      "executor": "@nx/vite:dev-server",
      "options": {
        "buildTarget": "wizard:build",
        "port": 3002,
        "hmr": true
      }
    },
    "preview": {
      "executor": "@nx/vite:preview-server",
      "options": {
        "buildTarget": "wizard:build",
        "port": 3002
      }
    }
  }
}
```

### Phase 4: Build & Publish Workflow

#### 4.1 Local Build Process

```bash
# Build the wizard UI and CLI together
NX_DAEMON=false npx nx build-package wizard

# Test CLI locally
node wizard/bin/cli.mjs

# Or test via npx (after building)
cd wizard && npx .
```

#### 4.2 Add Wizard to Nx Release Configuration

The project already uses `nx release publish` for `api` and `libs/*`. Simply add the wizard to the existing release configuration in `nx.json`:

```json
{
  "release": {
    "releaseTagPattern": "v{version}",
    "projects": ["api", "libs/*", "wizard"],  // Add wizard here
    "projectsRelationship": "fixed",
    // ... rest of existing config
  }
}
```

This allows the wizard to be published alongside other packages using the existing `.github/workflows/publish-npm.yml` workflow - no separate workflow needed.

#### 4.3 Ensure Build Runs Before Publish

The existing release config has `preVersionCommand: "npx nx run-many -t build"`. Verify the wizard's `build-package` target is invoked, or add it to the build chain:

Option A: Add `build-package` as a dependency of `build` in project.json:
```json
{
  "targets": {
    "build": {
      "dependsOn": ["build-cli"],
      // ... existing config
    }
  }
}
```

Option B: Update the `preVersionCommand` in nx.json to include the wizard package build:
```json
"preVersionCommand": "npx nx run-many -t build && npx nx build-package wizard"
```

#### 4.4 Version Management

- [ ] Version is managed in `wizard/package.json` (synced with other packages via `projectsRelationship: "fixed"`)
- [ ] Published automatically when tags are pushed (e.g., `v1.2.3`)
- [ ] No separate versioning workflow needed

### Phase 5: Documentation

#### 5.1 Update Main README

Add section to project README about accessing the wizard:

```markdown
## Configuration Wizard

Generate `.env` files and `docker run` commands using our interactive wizard:

### Online (Recommended)
Visit [wizard.dismissible.io](https://wizard.dismissible.io)

### Run Locally
For users who prefer to run the wizard locally (e.g., when working with sensitive credentials):

```bash
npx @dismissible/wizard
```

This starts a local server and opens the wizard in your browser. No data is sent to any server.
```

#### 5.2 Update wizard/README.md

Update the wizard README with CLI usage instructions:

```markdown
# @dismissible/wizard

Interactive configuration wizard for the Dismissible API. Generates `.env` files and `docker run` commands.

## Online Version

Visit [wizard.dismissible.io](https://wizard.dismissible.io) for the hosted version.

## Run Locally via npx

For users who prefer running locally (e.g., when working with sensitive credentials):

```bash
npx @dismissible/wizard
```

This will:
1. Start a local web server
2. Open the wizard in your default browser
3. Guide you through configuration options
4. Generate ready-to-use `.env` and `docker run` commands

All data stays on your machine - no network requests are made.

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build
```

## License

MIT
```

#### 5.3 Update Main Project README

- [ ] Add section about distribution options
- [ ] Document the build process for both targets
- [ ] Add deployment instructions

### Phase 6: Testing

#### 6.1 Local Testing

- [ ] Build and run CLI locally
- [ ] Verify all wizard functionality works
- [ ] Test on multiple Node.js versions (18, 20, 22)
- [ ] Test on different operating systems (macOS, Linux, Windows)

#### 6.2 npm Package Testing

- [ ] Test `npx @dismissible/wizard` from a fresh directory (after publishing)
- [ ] Verify browser auto-opens
- [ ] Test Ctrl+C shutdown
- [ ] Verify all wizard functionality works in local mode

#### 6.3 Hosted Version Testing

- [ ] Verify deployment to wizard.dismissible.io
- [ ] Test all wizard functionality
- [ ] Test share URLs work with new domain
- [ ] Check performance (bundle size, load time)

## Directory Structure After Implementation

```text
dismissible-api/
├── wizard/                       # Existing wizard React app + CLI
│   ├── bin/
│   │   └── cli.mjs               # NEW - CLI entry point
│   ├── cli/
│   │   ├── server.ts             # NEW - CLI server source
│   │   └── server.js             # NEW - Compiled output
│   ├── src/                      # Existing React app source
│   ├── dist/                     # NEW - Built assets (for npm)
│   ├── package.json              # Updated with bin field
│   ├── project.json              # Updated with CLI targets
│   ├── render.yaml               # NEW - Render deployment config
│   ├── tsconfig.json             # Existing
│   └── tsconfig.cli.json         # NEW - CLI TypeScript config
├── dist/
│   └── wizard/                   # Nx build output
├── nx.json                       # Updated release.projects
└── .github/
    └── workflows/
        ├── wizard-build.yml      # NEW - Build verification
        └── publish-npm.yml       # EXISTING - publishes wizard
```

## Security Considerations

### Hosted Version
- No server-side processing - everything runs in the browser
- Share URLs encode config in the URL fragment (never sent to server)
- HTTPS enforced via Render

### CLI Version
- Runs entirely locally
- No network requests after initial npm download
- User's configuration never leaves their machine
- Open source - users can audit the code

## Success Criteria

- [ ] `wizard.dismissible.io` serves the wizard and is accessible globally
- [ ] HTTPS is properly configured (via Render)
- [ ] `npx @dismissible/wizard` works on first try without errors
- [ ] CLI opens browser automatically
- [ ] All wizard functionality works identically in both versions
- [ ] Documentation clearly explains both options
- [ ] npm package is published under `@dismissible` scope (via existing `nx release publish`)
- [ ] Render handles deployment automatically via render.yaml
- [ ] Wizard is included in existing release workflow (no separate publish workflow)

## Future Enhancements (Out of Scope)

- [ ] `--no-open` flag to skip browser auto-open
- [ ] `--output` flag to save generated files directly
- [ ] Docker image for the CLI (`docker run dismissible/wizard`)
- [ ] Homebrew formula for macOS users
- [ ] Version check/update notification in CLI
