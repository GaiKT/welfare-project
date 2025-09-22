-- CreateEnum
CREATE TYPE "public"."ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "password" TEXT;

-- AlterTable
ALTER TABLE "public"."WelfareClaims" ADD COLUMN     "status" "public"."ClaimStatus" NOT NULL DEFAULT 'PENDING';
