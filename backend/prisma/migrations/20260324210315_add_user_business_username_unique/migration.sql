/*
  Warnings:

  - A unique constraint covering the columns `[businessId,username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_businessId_username_key" ON "User"("businessId", "username");
