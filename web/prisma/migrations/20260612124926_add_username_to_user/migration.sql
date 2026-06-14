-- AlterTable: Add username column to User table
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Backfill existing users with username derived from email
UPDATE "User" SET "username" = SPLIT_PART("email", '@', 1) WHERE "username" IS NULL;

-- Make username NOT NULL and UNIQUE
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
