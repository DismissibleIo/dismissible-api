# Deployment Guide

This guide covers deploying the Dismissible Configuration Wizard to various static hosting platforms.

## Pre-Deployment

1. **Build the wizard**:

   ```bash
   npm run wizard:build
   ```

2. **Verify the build**:
   ```bash
   npm run wizard:preview
   ```
   Visit http://localhost:3002 to test the production build locally.

## Deployment Options

### Option 1: GitHub Pages

1. **Create gh-pages branch**:

   ```bash
   git checkout -b gh-pages
   ```

2. **Copy build files**:

   ```bash
   cp -r dist/wizard/* .
   git add .
   git commit -m "Deploy wizard to GitHub Pages"
   git push origin gh-pages
   ```

3. **Configure GitHub Pages**:
   - Go to repository Settings > Pages
   - Select `gh-pages` branch
   - Click Save

4. **Access at**: `https://<username>.github.io/<repo-name>/`

### Option 2: Cloudflare Pages

1. **Connect repository**:
   - Go to Cloudflare Pages dashboard
   - Click "Create a project"
   - Connect your GitHub repository

2. **Configure build settings**:
   - Build command: `npm run wizard:build`
   - Build output directory: `dist/wizard`
   - Root directory: `/` (leave default)

3. **Deploy**: Cloudflare will automatically build and deploy

4. **Custom domain** (optional):
   - Go to project > Custom domains
   - Add `wizard.dismissible.io` or your preferred domain
   - Update DNS records as instructed

### Option 3: Vercel

1. **Install Vercel CLI** (optional):

   ```bash
   npm install -g vercel
   ```

2. **Deploy via CLI**:

   ```bash
   cd wizard
   vercel --prod
   ```

3. **Or deploy via web**:
   - Go to vercel.com
   - Import your repository
   - Build command: `npm run wizard:build`
   - Output directory: `dist/wizard`

4. **Custom domain**: Add in project settings

### Option 4: Netlify

1. **Deploy via CLI**:

   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist/wizard
   ```

2. **Or deploy via web**:
   - Go to netlify.com
   - Drag and drop `dist/wizard` folder
   - Or connect repository with:
     - Build command: `npm run wizard:build`
     - Publish directory: `dist/wizard`

3. **Custom domain**: Add in site settings

## Custom Domain Configuration

### For dismissible.io

1. **Add DNS records**:

   ```
   Type: CNAME
   Name: wizard (or @)
   Value: <your-hosting-provider-url>
   ```

2. **SSL Certificate**: Most providers auto-provision SSL certificates

## Environment-Specific Builds

If you need different configurations for different environments:

1. **Create environment files**:

   ```bash
   wizard/.env.production
   wizard/.env.staging
   ```

2. **Update build scripts** in `package.json`:
   ```json
   {
     "wizard:build:staging": "NODE_ENV=staging nx build wizard",
     "wizard:build:production": "NODE_ENV=production nx build wizard"
   }
   ```

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy-wizard.yml`:

```yaml
name: Deploy Wizard

on:
  push:
    branches:
      - main
    paths:
      - 'wizard/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build wizard
        run: npm run wizard:build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: dismissible-wizard
          directory: dist/wizard
```

## Post-Deployment

1. **Test all features**:
   - Navigate through all wizard steps
   - Generate .env file
   - Generate docker run command
   - Test copy to clipboard
   - Test download .env file

2. **Test on different devices**:
   - Desktop browsers (Chrome, Firefox, Safari)
   - Mobile devices (iOS Safari, Chrome)
   - Tablet devices

3. **Monitor**:
   - Set up analytics (Google Analytics, Plausible, etc.)
   - Monitor error logs
   - Track usage metrics

## Troubleshooting

### Build fails with TypeScript errors

```bash
# Clean and rebuild
npm run nx:reset
npm run wizard:build
```

### CSS not loading

- Check that Tailwind config is correct
- Verify build output includes CSS file
- Check browser console for errors

### 404 errors on refresh

- Configure hosting provider for SPA routing
- For GitHub Pages, add a `404.html` that redirects to `index.html`

## Rollback

If you need to rollback:

1. **GitHub Pages**:

   ```bash
   git revert <commit-hash>
   git push origin gh-pages
   ```

2. **Cloudflare/Vercel/Netlify**: Use provider's web dashboard to rollback to previous deployment

## Security Considerations

1. **No secrets in code**: The wizard is client-side only, never commit secrets
2. **HTTPS only**: Ensure SSL/TLS is enabled
3. **CSP headers**: Consider adding Content Security Policy headers
4. **Rate limiting**: Some providers offer DDoS protection

## Performance Optimization

The wizard is already optimized, but you can further improve:

1. **Enable compression**: Most providers enable gzip/brotli by default
2. **CDN**: Use a CDN for global distribution
3. **Caching**: Configure appropriate cache headers

## Support

For issues:

- Check the wizard README
- Review build logs
- Test locally with `npm run wizard:preview`
- Open an issue on GitHub
