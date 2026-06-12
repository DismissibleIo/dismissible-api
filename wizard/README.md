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

## Features

- Interactive step-by-step configuration
- Support for all Dismissible API configuration options
- Generates `.env` files ready for deployment
- Generates `docker run` commands with all environment variables
- Client-side only - no server required
- Mobile-responsive design

## Development

```bash
# Install dependencies (from repo root)
npm install

# Start dev server (http://localhost:3002)
NX_DAEMON=false npx nx serve wizard

# Build for production
NX_DAEMON=false npx nx build wizard

# Preview production build
NX_DAEMON=false npx nx preview wizard
```

## Building the CLI Package

```bash
# Build everything (wizard UI + CLI)
NX_DAEMON=false npx nx build-package wizard

# Test CLI locally
node wizard/bin/cli.mjs
```

## Tech Stack

- **Vite** - Build tool and dev server
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Headless UI** - Accessible UI components
- **Heroicons** - Icons
- **Zod** - Schema validation

## Architecture

The wizard is organized into phases:

1. **Core Settings**: Port, storage type, run setup
2. **Storage Configuration**: Conditional fields based on storage type
3. **Cache Configuration**: Optional caching configuration
4. **Swagger**: API documentation settings
5. **JWT Auth**: Optional authentication configuration
6. **CORS**: Cross-origin settings
7. **Security Headers**: Helmet configuration
8. **Validation**: Request validation settings
9. **Rate Limiter**: Optional rate limiting
10. **Review**: Summary and output generation

## Output

The wizard generates two types of output:

### .env File

Ready-to-use environment variable file for local development or deployment.

### Docker Run Command

Complete `docker run` command with all environment variables configured.

Both outputs support:

- Toggle to include/exclude default values

## License

MIT
