#!/bin/sh
set -e

echo "🚀 NexCal — Starting production server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations applied successfully"

# Run seed (idempotent — uses upsert)
echo "🌱 Seeding database..."
npx tsx prisma/seed.ts
echo "✅ Seed complete"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Server starting on port ${PORT:-3000}"

# Execute the main command (node server.js)
exec "$@"
