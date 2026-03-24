/*
  Warnings:

  - A unique constraint covering the columns `[businessId,username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "mpAccessToken" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "depositPercent" INTEGER,
ADD COLUMN     "requiresDeposit" BOOLEAN NOT NULL DEFAULT false;

