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
        'Cache-Control': 'no-cache',
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
│   Running locally at: ${url.padEnd(32)}     │
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
