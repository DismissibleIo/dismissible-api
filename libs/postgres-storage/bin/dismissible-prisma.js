#!/usr/bin/env node

/**
 * CLI helper for @dismissible/nestjs-postgres-storage
 * Runs Prisma commands with the correct schema and config paths.
 *
 * Usage:
 *   npx dismissible-prisma generate
 *   npx dismissible-prisma migrate dev
 *   npx dismissible-prisma migrate deploy
 *   npx dismissible-prisma db push
 *   npx dismissible-prisma studio
 */

const { execSync } = require('child_process');
const path = require('path');

const configPath = path.join(__dirname, '..', 'prisma.config.mjs');
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
@dismissible/nestjs-postgres-storage - Prisma CLI Helper

Usage:
  npx dismissible-prisma <command> [options]

Commands:
  generate          Generate Prisma Client
  migrate dev       Create and apply migrations (development)
  migrate deploy    Apply pending migrations (production)
  migrate reset     Reset database and apply all migrations
  db push           Push schema to database without migrations
  db pull           Pull schema from database
  studio            Open Prisma Studio

Examples:
  npx dismissible-prisma generate
  npx dismissible-prisma migrate dev --name init
  npx dismissible-prisma db push

Config location: ${configPath}
Schema location: ${schemaPath}
`);
  process.exit(0);
}

const command = `npx prisma ${args.join(' ')} --config="${configPath}"`;

console.log(`Running: ${command}\n`);

try {
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status || 1);
}
