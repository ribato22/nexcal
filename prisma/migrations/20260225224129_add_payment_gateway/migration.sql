-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED', 'FAILED');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "dp_amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payment_gateway" TEXT,
ADD COLUMN     "payment_ref_id" TEXT,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "payment_url" TEXT,
ADD COLUMN     "total_price" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "service_types" ADD COLUMN     "dp_percentage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 0;
