"use client";

import { useEffect, useState } from "react";
import { WelfareMetrics } from "@/components/welfare-dashboard/WelfareMetrics";
import BudgetUsage from "@/components/welfare-dashboard/BudgetUsage";
import MonthlyClaimsChart from "@/components/welfare-dashboard/MonthlyClaimsChart";
import ApprovalStatistics from "@/components/welfare-dashboard/ApprovalStatistics";
import RecentClaims from "@/components/welfare-dashboard/RecentClaims";
import WelfareSummary from "@/components/welfare-dashboard/WelfareSummary";

interface DashboardData {
  fiscalYear: number;
  metrics: {
    totalUsers: number;
    userGrowth: number;
    totalClaims: number;
    claimsGrowth: number;
    pendingClaims: number;
    approvedClaims: number;
  };
  budget: {
    totalBudget: number;
    usedAmount: number;
    remainingAmount: number;
    usagePercent: number;
  };
  monthlyClaimsData: number[];
  claimsByStatus: {
    status: string;
    count: number;
  }[];
  claimsByWelfare: {
    welfareId: string;
    welfareName: string;
    budget: number;
    claimCount: number;
    totalAmount: number;
  }[];
  recentClaims: {
    id: string;
    userName: string;
    welfareName: string;
    amount: number;
    status: string;
    submittedDate: string;
  }[];
  monthlyStatistics: {
    approved: number[];
    rejected: number[];
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/dashboard/stats");
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load dashboard data");
        }
      } catch (err) {
        setError("Failed to fetch dashboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-error-500 mb-2">เกิดข้อผิดพลาด</p>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <WelfareMetrics data={data.metrics} />
        <MonthlyClaimsChart data={data.monthlyClaimsData} />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <BudgetUsage data={data.budget} />
      </div>

      <div className="col-span-12">
        <ApprovalStatistics data={data.monthlyStatistics} />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <WelfareSummary data={data.claimsByWelfare} />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <RecentClaims data={data.recentClaims} />
      </div>
    </div>
  );
}
