-- Step 1: Drop the existing foreign key constraint
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";

-- Step 2: Alter the column to be nullable
ALTER TABLE "AuditLog" ALTER COLUMN "userId" DROP NOT NULL;

-- Step 3: Re-create the foreign key with SET NULL on delete
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;
