#!/bin/sh
set -e

# Run migrations if DISMISSIBLE_RUN_STORAGE_SETUP is enabled
if [ "$DISMISSIBLE_RUN_STORAGE_SETUP" = "true" ]; then
  echo "Running database migrations..."
  cd /app/dist/api
  npx dismissible-storage-setup
  echo "Migrations completed successfully!"
  cd /app
fi

# Start the application
exec node dist/api/src/main.js

