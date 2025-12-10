"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageLoading } from "@/components/ui/loading";

// Types
interface Quota {
  welfareSubTypeId: string;
  welfareTypeName: string;
  welfareSubTypeName: string;
  maxPerYear: number | null;
  maxLifetime: number | null;
  usedAmountYear: number;
  usedAmountLifetime: number;
  remainingYear: number | null;
  remainingLifetime: number | null;
}

interface Claim {
  id: string;
  welfareTypeName: string;
  welfareSubTypeName: string;
  requestedAmount: number;
  approvedAmount: number | null;
  status: string;
  submittedDate: string;
}

interface DashboardData {
  fiscalYear: number;
  quotas: Quota[];
  recentClaims: Claim[];
  unreadNotificationCount: number;
}

// Status badge configuration
const STATUS_CONFIG: Record<string, { text: string; className: string }> = {
  PENDING: {
    text: "รอตรวจสอบ",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  },
  IN_REVIEW: {
    text: "กำลังตรวจสอบ",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  },
  ADMIN_APPROVED: {
    text: "รออนุมัติขั้นสุดท้าย",
    className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
  },
  MANAGER_APPROVED: {
    text: "อนุมัติแล้ว",
    className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  },
  REJECTED: {
    text: "ไม่อนุมัติ",
    className: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  },
  COMPLETED: {
    text: "เสร็จสิ้น",
    className: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  },
};

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Fetch dashboard data - single API call
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/dashboard/user");
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || "ไม่สามารถโหลดข้อมูลได้");
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session, fetchData]);

  // Loading state
  if (status === "loading" || loading) {
    return <PageLoading text="กำลังโหลดข้อมูล..." fullScreen />;
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          สวัสดี, {session?.user?.firstName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          ปีงบประมาณ {data.fiscalYear}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <QuickAction
          href="/welfare"
          icon="plus"
          label="ยื่นคำร้อง"
          color="blue"
        />
        <QuickAction
          href="/claims"
          icon="document"
          label="คำร้องของฉัน"
          color="green"
        />
        <QuickAction
          href="/notifications"
          icon="bell"
          label="แจ้งเตือน"
          color="purple"
          badge={data.unreadNotificationCount}
        />
      </div>

      {/* Quotas Grid */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          โควตาสวัสดิการ
        </h2>
        {data.quotas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.quotas.map((quota) => (
              <QuotaCard key={quota.welfareSubTypeId} quota={quota} />
            ))}
          </div>
        ) : (
          <EmptyState message="ไม่มีข้อมูลโควตาสวัสดิการ" />
        )}
      </section>

      {/* Recent Claims */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            คำร้องล่าสุด
          </h2>
          <Link
            href="/claims"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ดูทั้งหมด →
          </Link>
        </div>
        {data.recentClaims.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      สวัสดิการ
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">
                      จำนวนเงิน
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">
                      สถานะ
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-300">
                      ดู
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.recentClaims.map((claim) => (
                    <ClaimRow key={claim.id} claim={claim} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState message="ยังไม่มีคำร้อง" actionLabel="ยื่นคำร้อง" actionHref="/welfare" />
        )}
      </section>
    </div>
  );
}

// Quick Action Component
function QuickAction({
  href,
  icon,
  label,
  color,
  badge,
}: {
  href: string;
  icon: "plus" | "document" | "bell";
  label: string;
  color: "blue" | "green" | "purple";
  badge?: number;
}) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  };

  const icons = {
    plus: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    ),
    document: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
    bell: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    ),
  };

  return (
    <Link
      href={href}
      className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
    >
      <div className={`relative p-3 rounded-full ${colorClasses[color]}`}>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icons[icon]}
        </svg>
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
    </Link>
  );
}

// Quota Card Component
function QuotaCard({ quota }: { quota: Quota }) {
  const hasYearLimit = quota.maxPerYear !== null;
  const hasLifetimeLimit = quota.maxLifetime !== null;

  // Calculate percentage
  let percentage = 0;
  if (hasYearLimit && quota.maxPerYear) {
    percentage = (quota.usedAmountYear / quota.maxPerYear) * 100;
  } else if (hasLifetimeLimit && quota.maxLifetime) {
    percentage = (quota.usedAmountLifetime / quota.maxLifetime) * 100;
  }

  const progressColor =
    percentage >= 90 ? "bg-red-500" : percentage >= 70 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {quota.welfareTypeName}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {quota.welfareSubTypeName}
        </p>
      </div>

      {hasYearLimit && (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">คงเหลือ/ปี</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {(quota.remainingYear ?? 0).toLocaleString()} บาท
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>ใช้ไป {quota.usedAmountYear.toLocaleString()}</span>
            <span>จาก {(quota.maxPerYear ?? 0).toLocaleString()} บาท</span>
          </div>
        </div>
      )}

      {hasLifetimeLimit && (
        <div className="space-y-1 text-sm mt-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">คงเหลือตลอดอายุ</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {(quota.remainingLifetime ?? 0).toLocaleString()} บาท
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>ใช้ไป {quota.usedAmountLifetime.toLocaleString()}</span>
            <span>จาก {(quota.maxLifetime ?? 0).toLocaleString()} บาท</span>
          </div>
        </div>
      )}

      {(hasYearLimit || hasLifetimeLimit) && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${progressColor}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Claim Row Component
function ClaimRow({ claim }: { claim: Claim }) {
  const config = STATUS_CONFIG[claim.status] || {
    text: claim.status,
    className: "bg-gray-100 text-gray-800",
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900 dark:text-white">
          {claim.welfareTypeName}
        </div>
        <div className="text-xs text-gray-500">{claim.welfareSubTypeName}</div>
      </td>
      <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-300">
        {claim.requestedAmount.toLocaleString()} ฿
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
          {config.text}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <Link
          href={`/claims/${claim.id}`}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          ดู
        </Link>
      </td>
    </tr>
  );
}

// Empty State Component
function EmptyState({
  message,
  actionLabel,
  actionHref,
}: {
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
