-- CreateTable
CREATE TABLE "PendingBooking" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "depositAmount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingBooking_businessId_idx" ON "PendingBooking"("businessId");

-- CreateIndex
CREATE INDEX "PendingBooking_professionalId_startAt_idx" ON "PendingBooking"("professionalId", "startAt");
