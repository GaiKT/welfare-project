import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentFiscalYear, getFiscalYearRange } from "@/lib/fiscal-year";

export async function GET(request: NextRequest) {
  try {
    const currentFiscalYear = getCurrentFiscalYear();
    const { startDate, endDate } = getFiscalYearRange(currentFiscalYear);

    // Get total users count
    const totalUsers = await prisma.user.count({
      where: { isActive: true },
    });

    // Get users from previous month for comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const usersLastMonth = await prisma.user.count({
      where: {
        isActive: true,
        createdAt: { lt: lastMonth },
      },
    });

    // Calculate user growth percentage
    const userGrowth =
      usersLastMonth > 0
        ? (((totalUsers - usersLastMonth) / usersLastMonth) * 100).toFixed(2)
        : 0;

    // Get total claims in current fiscal year
    const totalClaims = await prisma.welfareClaims.count({
      where: {
        fiscalYear: currentFiscalYear,
      },
    });

    // Get claims from previous fiscal year for comparison
    const claimsPreviousYear = await prisma.welfareClaims.count({
      where: {
        fiscalYear: currentFiscalYear - 1,
      },
    });

    // Calculate claims growth percentage
    const claimsGrowth =
      claimsPreviousYear > 0
        ? (
            ((totalClaims - claimsPreviousYear) / claimsPreviousYear) *
            100
          ).toFixed(2)
        : 0;

    // Get pending claims count
    const pendingClaims = await prisma.welfareClaims.count({
      where: {
        fiscalYear: currentFiscalYear,
        status: { in: ["PENDING", "IN_REVIEW", "ADMIN_APPROVED"] },
      },
    });

    // Get approved claims count
    const approvedClaims = await prisma.welfareClaims.count({
      where: {
        fiscalYear: currentFiscalYear,
        status: { in: ["MANAGER_APPROVED", "COMPLETED"] },
      },
    });

    // Get total welfare budget and used amount
    const welfareStats = await prisma.welfare.aggregate({
      _sum: {
        budget: true,
      },
    });

    const totalBudget = welfareStats._sum.budget || 0;

    // Get total used amount from approved claims in current fiscal year
    const usedAmountStats = await prisma.welfareClaims.aggregate({
      where: {
        fiscalYear: currentFiscalYear,
        status: { in: ["MANAGER_APPROVED", "COMPLETED"] },
      },
      _sum: {
        amount: true,
      },
    });

    const usedAmount = usedAmountStats._sum.amount || 0;
    const budgetUsagePercent =
      totalBudget > 0 ? ((usedAmount / totalBudget) * 100).toFixed(2) : 0;

    // Get claims by month for current fiscal year
    const claimsByMonth = await prisma.welfareClaims.groupBy({
      by: ["submittedDate"],
      where: {
        fiscalYear: currentFiscalYear,
      },
      _count: {
        id: true,
      },
    });

    // Process claims by month
    const monthlyData = new Array(12).fill(0);
    claimsByMonth.forEach((claim) => {
      const month = new Date(claim.submittedDate).getMonth();
      monthlyData[month] += claim._count.id;
    });

    // Get claims by status
    const claimsByStatus = await prisma.welfareClaims.groupBy({
      by: ["status"],
      where: {
        fiscalYear: currentFiscalYear,
      },
      _count: {
        id: true,
      },
    });

    // Get claims by welfare type
    const claimsByWelfare = await prisma.welfareClaims.groupBy({
      by: ["welfareId"],
      where: {
        fiscalYear: currentFiscalYear,
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    // Get welfare names
    const welfareTypes = await prisma.welfare.findMany({
      select: { id: true, name: true, budget: true },
    });

    const welfareMap = new Map(welfareTypes.map((w) => [w.id, w]));

    const claimsByWelfareWithNames = claimsByWelfare.map((item) => {
      const welfare = welfareMap.get(item.welfareId);
      return {
        welfareId: item.welfareId,
        welfareName: welfare?.name || "Unknown",
        budget: welfare?.budget || 0,
        claimCount: item._count.id,
        totalAmount: item._sum.amount || 0,
      };
    });

    // Get recent claims
    const recentClaims = await prisma.welfareClaims.findMany({
      take: 5,
      orderBy: { submittedDate: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        welfare: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get monthly statistics for line chart (approved vs rejected)
    const monthlyApproved = new Array(12).fill(0);
    const monthlyRejected = new Array(12).fill(0);

    const allClaimsWithDate = await prisma.welfareClaims.findMany({
      where: {
        fiscalYear: currentFiscalYear,
        status: { in: ["MANAGER_APPROVED", "COMPLETED", "REJECTED"] },
      },
      select: {
        submittedDate: true,
        status: true,
      },
    });

    allClaimsWithDate.forEach((claim) => {
      const month = new Date(claim.submittedDate).getMonth();
      if (claim.status === "REJECTED") {
        monthlyRejected[month]++;
      } else {
        monthlyApproved[month]++;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        fiscalYear: currentFiscalYear,
        metrics: {
          totalUsers,
          userGrowth: Number(userGrowth),
          totalClaims,
          claimsGrowth: Number(claimsGrowth),
          pendingClaims,
          approvedClaims,
        },
        budget: {
          totalBudget,
          usedAmount,
          remainingAmount: totalBudget - usedAmount,
          usagePercent: Number(budgetUsagePercent),
        },
        monthlyClaimsData: monthlyData,
        claimsByStatus: claimsByStatus.map((item) => ({
          status: item.status,
          count: item._count.id,
        })),
        claimsByWelfare: claimsByWelfareWithNames,
        recentClaims: recentClaims.map((claim) => ({
          id: claim.id,
          userName: `${claim.user.title} ${claim.user.firstName} ${claim.user.lastName}`,
          welfareName: claim.welfare.name,
          amount: claim.amount,
          status: claim.status,
          submittedDate: claim.submittedDate,
        })),
        monthlyStatistics: {
          approved: monthlyApproved,
          rejected: monthlyRejected,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
