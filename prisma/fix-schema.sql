-- Add missing columns to Admin table
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT;
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "isFirstLogin" BOOLEAN DEFAULT true;
ALTER TABLE "Admin" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN DEFAULT true;

-- Create NotificationType enum if not exists
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('CLAIM_SUBMITTED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'CLAIM_COMMENT', 'CLAIM_COMPLETED', 'SYSTEM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedClaimId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Create indexes for Notification
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
