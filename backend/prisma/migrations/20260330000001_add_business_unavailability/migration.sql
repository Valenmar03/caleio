CREATE TABLE "BusinessUnavailability" (
  "id"         TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "date"       TEXT NOT NULL,
  "reason"     TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BusinessUnavailability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessUnavailability_businessId_date_key"
  ON "BusinessUnavailability"("businessId", "date");

CREATE INDEX "BusinessUnavailability_businessId_idx"
  ON "BusinessUnavailability"("businessId");

ALTER TABLE "BusinessUnavailability"
  ADD CONSTRAINT "BusinessUnavailability_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
