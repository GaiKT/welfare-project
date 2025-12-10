import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentFiscalYear } from "@/lib/fiscal-year";
import { UserType } from "@/types/auth";

/**
 * GET /api/quota/calculate
 * Calculate welfare quota for current user with new WelfareType/SubType structure
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Only users can check their quota
    if (session.user.userType !== UserType.USER) {
      return NextResponse.json(
        { error: "Only regular users can check welfare quota" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fiscalYearParam = searchParams.get("fiscalYear");
    const fiscalYear = fiscalYearParam
      ? parseInt(fiscalYearParam)
      : getCurrentFiscalYear();

    // Get all welfare types with sub-types
    const welfareTypes = await prisma.welfareType.findMany({
      where: { isActive: true },
      include: {
        subTypes: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const quotaData = [];

    for (const welfareType of welfareTypes) {
      const subTypeQuotas = [];

      for (const subType of welfareType.subTypes) {
        // Get existing quota record
        let quota = await prisma.welfareQuota.findUnique({
          where: {
            userId_welfareSubTypeId_fiscalYear: {
              userId: session.user.id,
              welfareSubTypeId: subType.id,
              fiscalYear,
            },
          },
        });

        // If no quota record exists, calculate from claims
        if (!quota) {
          const completedClaims = await prisma.welfareClaims.findMany({
            where: {
              userId: session.user.id,
              welfareSubTypeId: subType.id,
              fiscalYear,
              status: "COMPLETED",
            },
          });

          const usedAmountYear = completedClaims.reduce(
            (sum, claim) => sum + (claim.approvedAmount || 0),
            0
          );
          const usedClaimsYear = completedClaims.length;

          // Get lifetime stats
          const lifetimeClaims = await prisma.welfareClaims.findMany({
            where: {
              userId: session.user.id,
              welfareSubTypeId: subType.id,
              status: "COMPLETED",
            },
          });

          const usedAmountLifetime = lifetimeClaims.reduce(
            (sum, claim) => sum + (claim.approvedAmount || 0),
            0
          );
          const usedClaimsLifetime = lifetimeClaims.length;

          // Create quota record
          quota = await prisma.welfareQuota.create({
            data: {
              userId: session.user.id,
              welfareSubTypeId: subType.id,
              fiscalYear,
              usedAmountYear,
              usedClaimsYear,
              usedAmountLifetime,
              usedClaimsLifetime,
            },
          });
        }

        // Calculate remaining amounts based on sub-type limits
        const remainingPerYear = subType.maxPerYear 
          ? subType.maxPerYear - quota.usedAmountYear 
          : null;
        const remainingLifetime = subType.maxLifetime 
          ? subType.maxLifetime - quota.usedAmountLifetime 
          : null;
        const remainingClaimsLifetime = subType.maxClaimsLifetime 
          ? subType.maxClaimsLifetime - quota.usedClaimsLifetime 
          : null;

        subTypeQuotas.push({
          subTypeId: subType.id,
          subTypeCode: subType.code,
          subTypeName: subType.name,
          amount: subType.amount,
          unitType: subType.unitType,
          maxPerRequest: subType.maxPerRequest,
          maxPerYear: subType.maxPerYear,
          maxLifetime: subType.maxLifetime,
          maxClaimsLifetime: subType.maxClaimsLifetime,
          usedAmountYear: quota.usedAmountYear,
          usedClaimsYear: quota.usedClaimsYear,
          usedAmountLifetime: quota.usedAmountLifetime,
          usedClaimsLifetime: quota.usedClaimsLifetime,
          remainingPerYear,
          remainingLifetime,
          remainingClaimsLifetime,
          canClaim: 
            (remainingClaimsLifetime === null || remainingClaimsLifetime > 0) &&
            (remainingLifetime === null || remainingLifetime > 0) &&
            (remainingPerYear === null || remainingPerYear > 0),
        });
      }

      quotaData.push({
        welfareTypeId: welfareType.id,
        welfareTypeCode: welfareType.code,
        welfareTypeName: welfareType.name,
        description: welfareType.description,
        subTypes: subTypeQuotas,
      });
    }

    return NextResponse.json({
      success: true,
      data:{
        fiscalYear,
        quotas: quotaData,
      }
    });
  } catch (error) {
    console.error("Calculate quota error:", error);
    return NextResponse.json(
      { error: "Failed to calculate quota" },
      { status: 500 }
    );
  }
}
