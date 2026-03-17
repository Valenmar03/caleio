-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'MERCADOPAGO', 'OTHER');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "depositMethod" "PaymentMethod",
ADD COLUMN     "finalPaidAt" TIMESTAMP(3),
ADD COLUMN     "finalPaymentMethod" "PaymentMethod";
