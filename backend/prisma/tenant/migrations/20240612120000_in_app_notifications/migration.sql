-- AlterEnum
ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'in_app';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "body" TEXT NOT NULL DEFAULT '';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "resourceType" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "resourceId" TEXT;
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "metadata" JSONB NOT NULL DEFAULT '{}';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "notifications_orgId_userId_readAt_idx" ON "notifications"("orgId", "userId", "readAt");
CREATE INDEX IF NOT EXISTS "notifications_orgId_userId_createdAt_idx" ON "notifications"("orgId", "userId", "createdAt");
