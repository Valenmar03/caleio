-- AlterTable Business: add slug with a temporary default for existing rows
ALTER TABLE "Business" ADD COLUMN "slug" TEXT;
UPDATE "Business" SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE("name", '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) WHERE "slug" IS NULL;
ALTER TABLE "Business" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- AlterTable User: make email optional, add username
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "username" TEXT;
CREATE UNIQUE INDEX "User_businessId_username_key" ON "User"("businessId", "username") WHERE "username" IS NOT NULL;

-- AlterTable Professional: add userId
ALTER TABLE "Professional" ADD COLUMN "userId" TEXT;
ALTER TABLE "Professional" ADD CONSTRAINT "Professional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Professional_userId_key" ON "Professional"("userId");
