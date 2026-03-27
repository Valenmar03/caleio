-- AlterTable
ALTER TABLE "Business" ADD COLUMN "lsCustomerId" TEXT;
ALTER TABLE "Business" ADD COLUMN "lsSubscriptionId" TEXT;
ALTER TABLE "Business" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Business" ADD COLUMN "billingExempt" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Business_lsCustomerId_key" ON "Business"("lsCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Business_lsSubscriptionId_key" ON "Business"("lsSubscriptionId");
