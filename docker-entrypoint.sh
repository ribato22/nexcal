#!/bin/sh
set -e

echo "🚀 NexCal — Starting production server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Run database migrations
echo "📦 Running database migrations..."
./node_modules/.bin/prisma migrate deploy
echo "✅ Migrations applied successfully"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Server starting on port ${PORT:-3000}"

# Execute the main command (node server.js)
exec "$@"
