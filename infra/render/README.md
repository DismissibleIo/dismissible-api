# Render Deployment Configuration

This directory contains the Render Blueprint configuration for deploying the Dismissible API.

## Overview

The `render.yaml` file defines the infrastructure-as-code configuration for deploying the API and its PostgreSQL database on Render.

## Prerequisites

- A Render account ([sign up here](https://render.com))
- Your repository connected to GitHub/GitLab/Bitbucket (optional - only needed if building from Dockerfile)

## Quick Start (Recommended)

The easiest way to deploy is using the **prebuilt official Docker image** (`dismissibleio/dismissible-api`). This image is already configured in `render.yaml` and ready to deploy - you just need to configure environment variables.

### 1. Copy the Blueprint File

The `render.yaml` file must be located in the **root of your repository** for Render to detect it:

```bash
cp infra/render/render.yaml render.yaml
```

Or manually copy the file from `infra/render/render.yaml` to `render.yaml` in the repository root.

**Note**: The blueprint is already configured to use the official prebuilt image `dismissibleio/dismissible-api:latest`. No changes needed - just deploy!

1. Go to the [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your repository (GitHub/GitLab/Bitbucket) - you can use any repo, even an empty one, since we're using a prebuilt image
4. Select the branch you want to deploy (e.g., `main`, `dev/fastify-mvp`)
5. Render will automatically detect the `render.yaml` file and deploy the prebuilt image

### 3. Configure Environment Variables

After the initial deployment, you **must** set the following environment variable in the Render dashboard:

- **`DISMISSIBLE_CORS_ORIGINS`**: Set this to your frontend domain(s), comma-separated
  - Example: `https://example.com,https://www.example.com`
  - This is required because it's marked as `sync: false` in the blueprint

To set it:

1. Go to your service in the Render dashboard
2. Navigate to **Environment** tab
3. Add or edit `DISMISSIBLE_CORS_ORIGINS` with your frontend URL(s)

### 4. Automatic Deployments

Once connected, Render will automatically:

- Pull and deploy the prebuilt `dismissibleio/dismissible-api` image (no build time needed!)
- Create and manage the PostgreSQL database
- Inject the database connection string automatically
- Deploy on every push to your linked branch (if you make changes to `render.yaml`)

## Building Your Own Image (Alternative)

If you want to build and deploy from your own Dockerfile instead of using the prebuilt image:

1. Uncomment the Dockerfile configuration in `render.yaml`:

   ```yaml
   runtime: docker
   dockerfilePath: ./Dockerfile
   dockerContext: .
   ```

2. Comment out the image section:

   ```yaml
   # runtime: image
   # image:
   #   url: docker.io/dismissibleio/dismissible-api:latest
   ```

3. Ensure your repository has a `Dockerfile` in the root directory

4. Connect your repository to Render (this method requires access to your source code)

## What Gets Deployed

### Web Service

- **Name**: `dismissible-api`
- **Runtime**: Docker Image (prebuilt official image)
- **Image**: `dismissibleio/dismissible-api:latest` (official release)
- **Plan**: Starter
- **Region**: Oregon
- **Health Check**: `/health`
- **Port**: 10000

### Database

- **Name**: `dismissible-db`
- **Type**: PostgreSQL
- **Plan**: Starter
- **Region**: Oregon
- **Database Name**: `dismissible`
- **User**: `dismissible`
- **Security**: Only accessible from Render services (IP allowlist is empty)

## Environment Variables

The blueprint automatically configures:

### Server Configuration

- `DISMISSIBLE_PORT`: 10000
- `PORT`: 10000

### Database

- `DISMISSIBLE_POSTGRES_STORAGE_CONNECTION_STRING`: Automatically injected from the database

### Security

- `DISMISSIBLE_SWAGGER_ENABLED`: false (disabled in production)
- `DISMISSIBLE_HELMET_ENABLED`: true
- Various Helmet security headers configured

### CORS

- `DISMISSIBLE_CORS_ENABLED`: true
- `DISMISSIBLE_CORS_ORIGINS`: **Must be set manually** (see step 3 above)
- `DISMISSIBLE_CORS_METHODS`: GET,POST,DELETE,OPTIONS
- `DISMISSIBLE_CORS_ALLOWED_HEADERS`: Content-Type,Authorization,x-request-id
- `DISMISSIBLE_CORS_CREDENTIALS`: true
- `DISMISSIBLE_CORS_MAX_AGE`: 86400

### JWT Authentication (Optional)

JWT authentication is enabled by default. Configure these in the Render dashboard if using an OIDC provider:

- `DISMISSIBLE_JWT_AUTH_ENABLED`: true (set to false to disable)
- `DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL`: Your OIDC provider's well-known URL
- `DISMISSIBLE_JWT_AUTH_ISSUER`: Expected issuer claim
- `DISMISSIBLE_JWT_AUTH_AUDIENCE`: Expected audience claim

Example for Auth0:

```
DISMISSIBLE_JWT_AUTH_WELL_KNOWN_URL=https://your-tenant.auth0.com/.well-known/openid-configuration
DISMISSIBLE_JWT_AUTH_ISSUER=https://your-tenant.auth0.com/
DISMISSIBLE_JWT_AUTH_AUDIENCE=your-api-identifier
```

> Set `DISMISSIBLE_JWT_AUTH_ENABLED=false` to disable authentication for testing.

### Node Environment

- `NODE_ENV`: production

## Updating the Configuration

To update the deployment configuration:

1. Edit `infra/render/render.yaml`
2. Copy it to the repository root: `cp infra/render/render.yaml render.yaml`
3. Commit and push the changes
4. Render will automatically detect and apply the changes

### Updating to a New Image Version

To use a specific version tag instead of `latest`, update the image URL in `render.yaml`:

```yaml
image:
  url: docker.io/dismissibleio/dismissible-api:v1.0.0 # Use specific version
```

### Switching Between Prebuilt Image and Dockerfile

The blueprint supports both deployment methods:

**Using Prebuilt Official Image (recommended - fastest)**:

```yaml
runtime: image
image:
  url: docker.io/dismissibleio/dismissible-api:latest
```

**Using Local Dockerfile (for custom builds)**:

```yaml
runtime: docker
dockerfilePath: ./Dockerfile
dockerContext: .
```

Simply comment/uncomment the relevant sections in `render.yaml` to switch between methods.

## Troubleshooting

### Blueprint Not Detected

- Ensure `render.yaml` is in the repository root (not in `infra/render/`)
- Check that the file is committed and pushed to your repository

### Database Connection Issues

- Verify the database was created successfully in the Render dashboard
- Check that the connection string is being injected (visible in the service's Environment tab)
- **Important**: You must run database migrations manually before the first deployment. See [Database Migrations](#database-migrations) below.

### CORS Errors

- Make sure `DISMISSIBLE_CORS_ORIGINS` is set in the Render dashboard
- Verify the frontend URL matches exactly (including protocol and trailing slashes)

### Docker Image Pull Errors

- Verify the image `dismissibleio/dismissible-api:latest` exists on Docker Hub
- Check that you have internet access to pull from Docker Hub
- For private images, configure registry credentials in Render Dashboard → Workspace Settings
- If building from Dockerfile, ensure your `Dockerfile` is in the repository root

## Resources

- [Render Blueprint Documentation](https://render.com/docs/infrastructure-as-code)
- [Render Dashboard](https://dashboard.render.com)
