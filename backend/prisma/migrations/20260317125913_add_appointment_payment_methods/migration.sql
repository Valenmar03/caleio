/*
  Warnings:

  - You are about to drop the column `priceFinal` on the `Appointment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "priceFinal",
ADD COLUMN     "totalPrice" DECIMAL(65,30);
