#!/usr/bin/env node
const { execSync } = require('child_process');

const storageType = process.env.DISMISSIBLE_STORAGE_TYPE || '';

switch (storageType) {
  case 'postgres':
    console.log('Running Postgres storage setup...');
    execSync('npm run storage:setup:postgres', { stdio: 'inherit' });
    break;
  case 'dynamodb':
    console.log('Running DynamoDB storage setup...');
    execSync('npm run storage:setup:dynamodb', { stdio: 'inherit' });
    break;
  case 'memory':
    console.log('No setup required for In Memory storage...');
    process.exit(0);
    break;
  default:
    if (storageType) {
      console.log(`Warning: Unknown storage type '${storageType}'. Skipping storage setup.`);
    } else {
      console.log('DISMISSIBLE_STORAGE_TYPE not set. Skipping storage setup.');
    }
    process.exit(0);
}
