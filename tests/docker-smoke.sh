#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
test_dir=$(mktemp -d)
project="nexcal-smoke-$(openssl rand -hex 5)"
port="${NEXCAL_TEST_PORT:-3300}"

cat > "$test_dir/.env" <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 16)
AUTH_SECRET=$(openssl rand -hex 32)
APP_BIND_ADDRESS=127.0.0.1
APP_PORT=$port
NEXT_PUBLIC_APP_URL=http://127.0.0.1:$port
SEED_PASSWORD=$(openssl rand -hex 16)
EOF

set -- docker compose -p "$project" --env-file "$test_dir/.env" -f docker-compose.prod.yml "$@"
cleanup() {
  "$@" down --volumes || true
  rm -rf "$test_dir"
}
trap 'cleanup "$@"' EXIT
trap 'exit 1' INT TERM

"$@" up -d --build
attempt=0
until curl -fsS --max-time 3 "http://127.0.0.1:$port/" > "$test_dir/page.html"; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    "$@" logs app
    exit 1
  fi
  sleep 2
done

db() {
  "$@" exec -T db psql -X -v ON_ERROR_STOP=1 -U nexcal_admin -d nexcal_db
}

test "$(echo 'SELECT count(*) FROM "users";' | "$@" exec -T db psql -XAt -U nexcal_admin -d nexcal_db)" = 0
db "$@" < tests/booking-slots.sql

# A legacy database may contain bookings with no management token.
"$@" exec -T db createdb -U nexcal_admin nexcal_legacy
legacy() {
  "$@" exec -T db psql -X -v ON_ERROR_STOP=1 -U nexcal_admin -d nexcal_legacy
}
for migration in prisma/migrations/20260225*/migration.sql; do
  legacy "$@" < "$migration"
done
legacy "$@" <<'SQL'
INSERT INTO "users" ("id", "email", "hashed_password", "name", "updated_at")
VALUES ('legacy-provider', 'legacy@example.invalid', 'unused', 'Legacy Provider', now());
INSERT INTO "service_types" ("id", "user_id", "name", "duration")
VALUES ('legacy-service', 'legacy-provider', 'Legacy Service', 30);
INSERT INTO "bookings" ("id", "user_id", "service_type_id", "date", "start_time",
  "end_time", "patient_name", "patient_phone", "updated_at")
VALUES ('legacy-booking', 'legacy-provider', 'legacy-service', '2035-01-08',
  '2035-01-08 09:00', '2035-01-08 09:30', 'Synthetic', '0000000000', now());
SQL
legacy "$@" < prisma/migrations/20260228160000_restore_booking_schema/migration.sql
test "$("$@" exec -T db psql -XAt -U nexcal_admin -d nexcal_legacy -c \
  'SELECT count(*) FROM bookings WHERE id = '\''legacy-booking'\'' AND management_token IS NOT NULL')" = 1

"$@" exec -T app ./node_modules/.bin/prisma db seed
curl -fsS --max-time 5 "http://127.0.0.1:$port/" > "$test_dir/page.html"
grep -q 'Dr. Budi Santoso' "$test_dir/page.html"
grep -q 'Bidan Sari Dewi' "$test_dir/page.html"

echo 'Docker startup, migrations, booking constraints, and explicit demo seed passed.'
