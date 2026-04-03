ALTER TABLE "Business" ADD COLUMN "address" TEXT;
ALTER TABLE "Business" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Business" ADD COLUMN "whatsappPhone" TEXT;
ALTER TABLE "Business" ADD COLUMN "bookingTheme" TEXT NOT NULL DEFAULT 'default';
