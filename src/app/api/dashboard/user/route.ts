import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentFiscalYear } from "@/lib/fiscal-year";
import { UserType } from "@/types/auth";

/**
 * GET /api/dashboard/user
 * Single optimized endpoint for user dashboard data
 * Combines: quotas, recent claims, unread notification count
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.userType !== UserType.USER) {
      return NextResponse.json(
        { success: false, error: "This endpoint is for regular users only" },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const fiscalYear = getCurrentFiscalYear();

    // Parallel fetch all data for better performance
    const [
      welfareTypes,
      recentClaims,
      unreadNotificationCount,
      existingQuotas,
    ] = await Promise.all([
      // Get welfare types with sub-types
      prisma.welfareType.findMany({
        where: { isActive: true },
        include: {
          subTypes: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      }),
      // Get recent claims (limit 5)
      prisma.welfareClaims.findMany({
        where: { userId },
        include: {
          welfareSubType: {
            select: {
              name: true,
              welfareType: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Get unread notification count only (not full list)
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
      // Get existing quota records for this user and fiscal year
      prisma.welfareQuota.findMany({
        where: { userId, fiscalYear },
      }),
    ]);

    // Build quota map for quick lookup
    const quotaMap = new Map(
      existingQuotas.map((q) => [q.welfareSubTypeId, q])
    );

    // Build flattened quotas from welfare types
    const quotas = [];
    for (const welfareType of welfareTypes) {
      for (const subType of welfareType.subTypes) {
        const quota = quotaMap.get(subType.id);
        const usedAmountYear = quota?.usedAmountYear ?? 0;
        const usedAmountLifetime = quota?.usedAmountLifetime ?? 0;
        const usedClaimsYear = quota?.usedClaimsYear ?? 0;
        const usedClaimsLifetime = quota?.usedClaimsLifetime ?? 0;

        quotas.push({
          welfareSubTypeId: subType.id,
          welfareTypeName: welfareType.name,
          welfareSubTypeName: subType.name,
          // Unit type and amount info
          unitType: subType.unitType,
          amount: subType.amount,
          // Amount limits
          maxPerRequest: subType.maxPerRequest,
          maxPerYear: subType.maxPerYear,
          maxLifetime: subType.maxLifetime,
          // Claims count limits
          maxClaimsPerYear: subType.maxClaimsPerYear,
          maxClaimsLifetime: subType.maxClaimsLifetime,
          // Used amounts
          usedAmountYear,
          usedAmountLifetime,
          usedClaimsYear,
          usedClaimsLifetime,
          // Calculated remaining
          remainingYear: subType.maxPerYear
            ? Math.max(0, subType.maxPerYear - usedAmountYear)
            : null,
          remainingLifetime: subType.maxLifetime
            ? Math.max(0, subType.maxLifetime - usedAmountLifetime)
            : null,
          remainingClaimsYear: subType.maxClaimsPerYear
            ? Math.max(0, subType.maxClaimsPerYear - usedClaimsYear)
            : null,
          remainingClaimsLifetime: subType.maxClaimsLifetime
            ? Math.max(0, subType.maxClaimsLifetime - usedClaimsLifetime)
            : null,
        });
      }
    }

    // Format claims for response
    const claims = recentClaims.map((claim) => ({
      id: claim.id,
      welfareTypeName: claim.welfareSubType.welfareType.name,
      welfareSubTypeName: claim.welfareSubType.name,
      requestedAmount: claim.requestedAmount,
      approvedAmount: claim.approvedAmount,
      status: claim.status,
      submittedDate: claim.submittedDate,
    }));

    return NextResponse.json({
      success: true,
      data: {
        fiscalYear,
        quotas,
        recentClaims: claims,
        unreadNotificationCount,
      },
    });
  } catch (error) {
    console.error("User dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
