import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentFiscalYear, getFiscalYearRange } from "@/lib/fiscal-year";
import { UserType } from "@/types/auth";

/**
 * GET /api/quota/calculate
 * Calculate welfare quota for current user
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

    // Get all welfare types
    const welfares = await prisma.welfare.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        maxUsed: true,
      },
    });

    const quotaData = [];

    for (const welfare of welfares) {
      // Get existing quota record
      let quota = await prisma.welfareQuota.findUnique({
        where: {
          userId_welfareId_fiscalYear: {
            userId: session.user.id,
            welfareId: welfare.id,
            fiscalYear,
          },
        },
      });

      // If no quota record exists, calculate from claims
      if (!quota) {
        const { startDate, endDate } = getFiscalYearRange(fiscalYear);

        const completedClaims = await prisma.welfareClaims.findMany({
          where: {
            userId: session.user.id,
            welfareId: welfare.id,
            fiscalYear,
            status: "COMPLETED",
            completedDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        const usedAmount = completedClaims.reduce(
          (sum, claim) => sum + claim.amount,
          0
        );

        // Create quota record
        quota = await prisma.welfareQuota.create({
          data: {
            userId: session.user.id,
            welfareId: welfare.id,
            fiscalYear,
            totalQuota: welfare.maxUsed,
            usedAmount,
            remainingAmount: welfare.maxUsed - usedAmount,
          },
        });
      }

      quotaData.push({
        welfareId: welfare.id,
        welfareName: welfare.name,
        description: welfare.description,
        totalQuota: quota.totalQuota,
        usedAmount: quota.usedAmount,
        remainingAmount: quota.remainingAmount,
        usagePercentage:
          quota.totalQuota > 0
            ? Math.round((quota.usedAmount / quota.totalQuota) * 100)
            : 0,
      });
    }

    return NextResponse.json({
      success: true,
      fiscalYear,
      quotas: quotaData,
    });
  } catch (error) {
    console.error("Calculate quota error:", error);
    return NextResponse.json(
      { error: "Failed to calculate quota" },
      { status: 500 }
    );
  }
}
