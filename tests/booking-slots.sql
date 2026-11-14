\set ON_ERROR_STOP on
BEGIN;

INSERT INTO "users" ("id", "email", "hashed_password", "name", "updated_at")
VALUES ('test-provider-a', 'a@example.invalid', 'unused', 'Test Provider A', now()),
       ('test-provider-b', 'b@example.invalid', 'unused', 'Test Provider B', now());

INSERT INTO "service_types" ("id", "user_id", "name", "duration")
VALUES ('test-service-a', 'test-provider-a', 'Test Service', 30),
       ('test-service-b', 'test-provider-b', 'Test Service', 30);

-- Cancelling an active booking must make its slot available again.
INSERT INTO "bookings" (
  "id", "user_id", "service_type_id", "management_token", "status", "date",
  "start_time", "end_time", "patient_name", "patient_phone", "updated_at"
)
VALUES
  ('test-cancelled', 'test-provider-a', 'test-service-a', gen_random_uuid(), 'CONFIRMED',
   '2035-01-08', '2035-01-08 09:00', '2035-01-08 09:30', 'Synthetic', '0000000000', now());

UPDATE "bookings" SET "status" = 'CANCELLED' WHERE "id" = 'test-cancelled';

INSERT INTO "bookings" (
  "id", "user_id", "service_type_id", "management_token", "status", "date",
  "start_time", "end_time", "patient_name", "patient_phone", "updated_at"
)
VALUES
  ('test-rebooked', 'test-provider-a', 'test-service-a', gen_random_uuid(), 'PENDING',
   '2035-01-08', '2035-01-08 09:00', '2035-01-08 09:30', 'Synthetic', '0000000000', now()),
  ('test-adjacent', 'test-provider-a', 'test-service-a', gen_random_uuid(), 'CONFIRMED',
   '2035-01-08', '2035-01-08 09:30', '2035-01-08 10:00', 'Synthetic', '0000000000', now()),
  ('test-other-provider', 'test-provider-b', 'test-service-b', gen_random_uuid(), 'CONFIRMED',
   '2035-01-08', '2035-01-08 09:00', '2035-01-08 09:30', 'Synthetic', '0000000000', now());

DO $$
BEGIN
  BEGIN
    INSERT INTO "bookings" (
      "id", "user_id", "service_type_id", "management_token", "status", "date",
      "start_time", "end_time", "patient_name", "patient_phone", "updated_at"
    )
    VALUES ('test-overlap', 'test-provider-a', 'test-service-a', gen_random_uuid(), 'CONFIRMED',
        '2035-01-08', '2035-01-08 09:15', '2035-01-08 09:45', 'Synthetic', '0000000000', now());
    RAISE EXCEPTION 'Overlapping active booking was accepted';
  EXCEPTION WHEN exclusion_violation THEN
    NULL;
  END;

  BEGIN
    UPDATE "bookings" SET "status" = 'CONFIRMED' WHERE "id" = 'test-cancelled';
    RAISE EXCEPTION 'Cancelled booking was reactivated despite an active replacement';
  EXCEPTION WHEN exclusion_violation THEN
    NULL;
  END;

  BEGIN
    UPDATE "bookings"
    SET "start_time" = '2035-01-08 09:00', "end_time" = '2035-01-08 09:30'
    WHERE "id" = 'test-adjacent';
    RAISE EXCEPTION 'Reschedule to an occupied slot was accepted';
  EXCEPTION WHEN exclusion_violation THEN
    NULL;
  END;
END $$;

ROLLBACK;
