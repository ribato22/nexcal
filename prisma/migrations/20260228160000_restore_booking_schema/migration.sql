BEGIN;

ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "management_token" TEXT,
  ADD COLUMN IF NOT EXISTS "meeting_url" TEXT,
  ADD COLUMN IF NOT EXISTS "reschedule_count" INTEGER NOT NULL DEFAULT 0;

UPDATE "bookings"
SET "management_token" = gen_random_uuid()::text
WHERE "management_token" IS NULL;

ALTER TABLE "bookings" ALTER COLUMN "management_token" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_management_token_key" ON "bookings"("management_token");

ALTER TABLE "organizations"
  ADD COLUMN IF NOT EXISTS "gcal_client_id" TEXT,
  ADD COLUMN IF NOT EXISTS "gcal_client_secret" TEXT,
  ADD COLUMN IF NOT EXISTS "midtrans_client_key" TEXT,
  ADD COLUMN IF NOT EXISTS "midtrans_is_prod" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "midtrans_server_key" TEXT,
  ADD COLUMN IF NOT EXISTS "multiwa_api_key" TEXT,
  ADD COLUMN IF NOT EXISTS "multiwa_session_id" TEXT,
  ADD COLUMN IF NOT EXISTS "multiwa_url" TEXT;

ALTER TABLE "service_types" ADD COLUMN IF NOT EXISTS "is_virtual" BOOLEAN NOT NULL DEFAULT false;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Use half-open ranges so consecutive appointments can touch at their endpoints.
ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_active_slot_exclusion"
  EXCLUDE USING gist (
    "user_id" WITH =,
    tsrange("start_time", "end_time", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));

DROP INDEX IF EXISTS "bookings_user_id_start_time_key";

COMMIT;
