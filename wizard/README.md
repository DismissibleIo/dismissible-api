# Dismissible API Configuration Wizard

An interactive web-based wizard for configuring the Dismissible API. This tool helps developers easily generate `.env` files and `docker run` commands with all necessary configuration options.

## Features

- Interactive step-by-step configuration
- Support for all Dismissible API configuration options
- Generates `.env` files ready for deployment
- Generates `docker run` commands with all environment variables
- Client-side only - no server required
- Mobile-responsive design

## Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3002)
npm run wizard

# Build for production
npm run wizard:build

# Preview production build
npm run wizard:preview
```

## Deployment

The wizard is a static site that can be deployed to any static hosting service:

1. Build the wizard: `npm run wizard:build`
2. Deploy the `dist/wizard/` directory to your hosting service

Deployment options:

- **GitHub Pages**: Deploy `dist/wizard/` to gh-pages branch
- **Cloudflare Pages**: Connect repo, build command `npm run wizard:build`, output dir `dist/wizard`
- **Vercel/Netlify**: Similar setup

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
