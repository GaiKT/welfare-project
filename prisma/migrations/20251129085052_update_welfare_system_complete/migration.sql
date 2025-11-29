/*
  Warnings:

  - The values [SUPER_ADMIN,MODERATOR] on the enum `AdminRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [APPROVED] on the enum `ClaimStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `usedAt` on the `WelfareClaims` table. All the data in the column will be lost.
  - Added the required column `fiscalYear` to the `WelfareClaims` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('CLAIM_SUBMITTED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'CLAIM_COMMENT', 'CLAIM_COMPLETED', 'SYSTEM');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."AdminRole_new" AS ENUM ('PRIMARY', 'ADMIN', 'MANAGER');
ALTER TABLE "public"."Admin" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."Admin" ALTER COLUMN "role" TYPE "public"."AdminRole_new" USING ("role"::text::"public"."AdminRole_new");
ALTER TABLE "public"."ClaimApproval" ALTER COLUMN "approverRole" TYPE "public"."AdminRole_new" USING ("approverRole"::text::"public"."AdminRole_new");
ALTER TYPE "public"."AdminRole" RENAME TO "AdminRole_old";
ALTER TYPE "public"."AdminRole_new" RENAME TO "AdminRole";
DROP TYPE "public"."AdminRole_old";
ALTER TABLE "public"."Admin" ALTER COLUMN "role" SET DEFAULT 'ADMIN';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ClaimStatus_new" AS ENUM ('PENDING', 'IN_REVIEW', 'ADMIN_APPROVED', 'MANAGER_APPROVED', 'REJECTED', 'COMPLETED');
ALTER TABLE "public"."WelfareClaims" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."WelfareClaims" ALTER COLUMN "status" TYPE "public"."ClaimStatus_new" USING ("status"::text::"public"."ClaimStatus_new");
ALTER TABLE "public"."ClaimApproval" ALTER COLUMN "status" TYPE "public"."ClaimStatus_new" USING ("status"::text::"public"."ClaimStatus_new");
ALTER TYPE "public"."ClaimStatus" RENAME TO "ClaimStatus_old";
ALTER TYPE "public"."ClaimStatus_new" RENAME TO "ClaimStatus";
DROP TYPE "public"."ClaimStatus_old";
ALTER TABLE "public"."WelfareClaims" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Admin" ADD COLUMN     "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "signatureUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."WelfareClaims" DROP COLUMN "usedAt",
ADD COLUMN     "adminApprovedAt" TIMESTAMP(3),
ADD COLUMN     "adminApproverId" TEXT,
ADD COLUMN     "completedDate" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "fiscalYear" INTEGER NOT NULL,
ADD COLUMN     "managerApprovedAt" TIMESTAMP(3),
ADD COLUMN     "managerApproverId" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "submittedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "public"."ClaimDocument" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClaimApproval" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approverRole" "public"."AdminRole" NOT NULL,
    "status" "public"."ClaimStatus" NOT NULL,
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClaimComment" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "commentBy" TEXT NOT NULL,
    "userType" "public"."UserType" NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedClaimId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WelfareQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "welfareId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "totalQuota" DOUBLE PRECISION NOT NULL,
    "usedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WelfareQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClaimDocument_claimId_idx" ON "public"."ClaimDocument"("claimId");

-- CreateIndex
CREATE INDEX "ClaimApproval_claimId_idx" ON "public"."ClaimApproval"("claimId");

-- CreateIndex
CREATE INDEX "ClaimApproval_approverId_idx" ON "public"."ClaimApproval"("approverId");

-- CreateIndex
CREATE INDEX "ClaimComment_claimId_idx" ON "public"."ClaimComment"("claimId");

-- CreateIndex
CREATE INDEX "ClaimComment_commentBy_idx" ON "public"."ClaimComment"("commentBy");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "public"."Notification"("isRead");

-- CreateIndex
CREATE INDEX "WelfareQuota_userId_idx" ON "public"."WelfareQuota"("userId");

-- CreateIndex
CREATE INDEX "WelfareQuota_fiscalYear_idx" ON "public"."WelfareQuota"("fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "WelfareQuota_userId_welfareId_fiscalYear_key" ON "public"."WelfareQuota"("userId", "welfareId", "fiscalYear");

-- CreateIndex
CREATE INDEX "WelfareClaims_fiscalYear_idx" ON "public"."WelfareClaims"("fiscalYear");

-- CreateIndex
CREATE INDEX "WelfareClaims_status_idx" ON "public"."WelfareClaims"("status");

-- AddForeignKey
ALTER TABLE "public"."WelfareClaims" ADD CONSTRAINT "WelfareClaims_adminApproverId_fkey" FOREIGN KEY ("adminApproverId") REFERENCES "public"."Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WelfareClaims" ADD CONSTRAINT "WelfareClaims_managerApproverId_fkey" FOREIGN KEY ("managerApproverId") REFERENCES "public"."Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClaimDocument" ADD CONSTRAINT "ClaimDocument_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "public"."WelfareClaims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClaimApproval" ADD CONSTRAINT "ClaimApproval_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "public"."WelfareClaims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClaimApproval" ADD CONSTRAINT "ClaimApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "public"."Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClaimComment" ADD CONSTRAINT "ClaimComment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "public"."WelfareClaims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClaimComment" ADD CONSTRAINT "ClaimComment_commentBy_fkey" FOREIGN KEY ("commentBy") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_relatedClaimId_fkey" FOREIGN KEY ("relatedClaimId") REFERENCES "public"."WelfareClaims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WelfareQuota" ADD CONSTRAINT "WelfareQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WelfareQuota" ADD CONSTRAINT "WelfareQuota_welfareId_fkey" FOREIGN KEY ("welfareId") REFERENCES "public"."Welfare"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
