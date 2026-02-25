-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PROVIDER');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashed_password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PROVIDER',
    "clinic_name" TEXT,
    "clinic_address" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_overrides" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT true,
    "start_time" TEXT,
    "end_time" TEXT,
    "reason" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "date_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "date" DATE NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "patient_name" TEXT NOT NULL,
    "patient_phone" TEXT NOT NULL,
    "patient_notes" TEXT,
    "cancel_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "service_type_id" TEXT NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_user_id_day_of_week_start_time_key" ON "schedules"("user_id", "day_of_week", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "date_overrides_user_id_date_key" ON "date_overrides"("user_id", "date");

-- CreateIndex
CREATE INDEX "bookings_user_id_date_status_idx" ON "bookings"("user_id", "date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_user_id_start_time_key" ON "bookings"("user_id", "start_time");

-- AddForeignKey
ALTER TABLE "service_types" ADD CONSTRAINT "service_types_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_overrides" ADD CONSTRAINT "date_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
