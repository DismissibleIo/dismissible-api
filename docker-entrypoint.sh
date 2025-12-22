#!/bin/sh
set -e

# Run migrations if DISMISSIBLE_RUN_MIGRATION is enabled
if [ "$DISMISSIBLE_RUN_MIGRATION" = "true" ]; then
  echo "Running database migrations..."
  cd /app/dist/api
  npm run prisma:migrate:deploy
  echo "Migrations completed successfully!"
  cd /app
fi

# Start the application
exec node dist/api/src/main.js

