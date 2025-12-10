-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('PRIMARY', 'ADMIN', 'MANAGER');

-- CreateEnum
CREATE TYPE "WelfareUnitType" AS ENUM ('LUMP_SUM', 'PER_NIGHT', 'PER_INCIDENT');

-- CreateEnum
CREATE TYPE "BeneficiaryRelation" AS ENUM ('SELF', 'SPOUSE', 'CHILD', 'FATHER', 'MOTHER');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'ADMIN_APPROVED', 'MANAGER_APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CLAIM_SUBMITTED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'CLAIM_COMMENT', 'CLAIM_COMPLETED', 'SYSTEM');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "signatureUrl" TEXT,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "image" TEXT,
    "password" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelfareType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WelfareType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelfareSubType" (
    "id" TEXT NOT NULL,
    "welfareTypeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "unitType" "WelfareUnitType" NOT NULL DEFAULT 'LUMP_SUM',
    "maxPerRequest" DOUBLE PRECISION,
    "maxPerYear" DOUBLE PRECISION,
    "maxLifetime" DOUBLE PRECISION,
    "maxClaimsPerYear" INTEGER,
    "maxClaimsLifetime" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WelfareSubType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequiredDocument" (
    "id" TEXT NOT NULL,
    "welfareTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequiredDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelfareClaims" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "welfareSubTypeId" TEXT NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "approvedAmount" DOUBLE PRECISION,
    "nights" INTEGER,
    "beneficiaryName" TEXT,
    "beneficiaryRelation" "BeneficiaryRelation",
    "description" TEXT,
    "incidentDate" TIMESTAMP(3),
    "hospitalName" TEXT,
    "admissionDate" TIMESTAMP(3),
    "dischargeDate" TIMESTAMP(3),
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "fiscalYear" INTEGER NOT NULL,
    "submittedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "adminApproverId" TEXT,
    "adminApprovedAt" TIMESTAMP(3),
    "managerApproverId" TEXT,
    "managerApprovedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WelfareClaims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimDocument" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
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
CREATE TABLE "ClaimApproval" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approverRole" "AdminRole" NOT NULL,
    "status" "ClaimStatus" NOT NULL,
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimComment" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "commentBy" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WelfareQuota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "welfareSubTypeId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "usedAmountYear" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usedClaimsYear" INTEGER NOT NULL DEFAULT 0,
    "usedAmountLifetime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usedClaimsLifetime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WelfareQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedClaimId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_identity_key" ON "User"("identity");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WelfareType_code_key" ON "WelfareType"("code");

-- CreateIndex
CREATE INDEX "WelfareSubType_welfareTypeId_idx" ON "WelfareSubType"("welfareTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "WelfareSubType_welfareTypeId_code_key" ON "WelfareSubType"("welfareTypeId", "code");

-- CreateIndex
CREATE INDEX "RequiredDocument_welfareTypeId_idx" ON "RequiredDocument"("welfareTypeId");

-- CreateIndex
CREATE INDEX "WelfareClaims_userId_idx" ON "WelfareClaims"("userId");

-- CreateIndex
CREATE INDEX "WelfareClaims_welfareSubTypeId_idx" ON "WelfareClaims"("welfareSubTypeId");

-- CreateIndex
CREATE INDEX "WelfareClaims_fiscalYear_idx" ON "WelfareClaims"("fiscalYear");

-- CreateIndex
CREATE INDEX "WelfareClaims_status_idx" ON "WelfareClaims"("status");

-- CreateIndex
CREATE INDEX "ClaimDocument_claimId_idx" ON "ClaimDocument"("claimId");

-- CreateIndex
CREATE INDEX "ClaimApproval_claimId_idx" ON "ClaimApproval"("claimId");

-- CreateIndex
CREATE INDEX "ClaimApproval_approverId_idx" ON "ClaimApproval"("approverId");

-- CreateIndex
CREATE INDEX "ClaimComment_claimId_idx" ON "ClaimComment"("claimId");

-- CreateIndex
CREATE INDEX "ClaimComment_commentBy_idx" ON "ClaimComment"("commentBy");

-- CreateIndex
CREATE INDEX "WelfareQuota_userId_idx" ON "WelfareQuota"("userId");

-- CreateIndex
CREATE INDEX "WelfareQuota_welfareSubTypeId_idx" ON "WelfareQuota"("welfareSubTypeId");

-- CreateIndex
CREATE INDEX "WelfareQuota_fiscalYear_idx" ON "WelfareQuota"("fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "WelfareQuota_userId_welfareSubTypeId_fiscalYear_key" ON "WelfareQuota"("userId", "welfareSubTypeId", "fiscalYear");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "AuditLog_adminId_idx" ON "AuditLog"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "WelfareSubType" ADD CONSTRAINT "WelfareSubType_welfareTypeId_fkey" FOREIGN KEY ("welfareTypeId") REFERENCES "WelfareType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequiredDocument" ADD CONSTRAINT "RequiredDocument_welfareTypeId_fkey" FOREIGN KEY ("welfareTypeId") REFERENCES "WelfareType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareClaims" ADD CONSTRAINT "WelfareClaims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareClaims" ADD CONSTRAINT "WelfareClaims_welfareSubTypeId_fkey" FOREIGN KEY ("welfareSubTypeId") REFERENCES "WelfareSubType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareClaims" ADD CONSTRAINT "WelfareClaims_adminApproverId_fkey" FOREIGN KEY ("adminApproverId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareClaims" ADD CONSTRAINT "WelfareClaims_managerApproverId_fkey" FOREIGN KEY ("managerApproverId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimDocument" ADD CONSTRAINT "ClaimDocument_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "WelfareClaims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimApproval" ADD CONSTRAINT "ClaimApproval_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "WelfareClaims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimApproval" ADD CONSTRAINT "ClaimApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimComment" ADD CONSTRAINT "ClaimComment_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "WelfareClaims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaimComment" ADD CONSTRAINT "ClaimComment_commentBy_fkey" FOREIGN KEY ("commentBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareQuota" ADD CONSTRAINT "WelfareQuota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WelfareQuota" ADD CONSTRAINT "WelfareQuota_welfareSubTypeId_fkey" FOREIGN KEY ("welfareSubTypeId") REFERENCES "WelfareSubType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_relatedClaimId_fkey" FOREIGN KEY ("relatedClaimId") REFERENCES "WelfareClaims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
