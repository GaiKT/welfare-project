"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface WelfareQuota {
  welfareId: string;
  welfareName: string;
  totalQuota: number;
  usedAmount: number;
  remainingAmount: number;
  usagePercentage: number;
}

interface Claim {
  id: string;
  welfare: {
    name: string;
  };
  amount: number;
  status: string;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quotas, setQuotas] = useState<WelfareQuota[]>([]);
  const [recentClaims, setRecentClaims] = useState<Claim[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch quotas
      const quotaRes = await fetch("/api/quota/calculate");
      if (quotaRes.ok) {
        const quotaData = await quotaRes.json();
        setQuotas(quotaData.quotas || []);
      }

      // Fetch recent claims
      const claimsRes = await fetch("/api/claims?limit=5");
      if (claimsRes.ok) {
        const claimsData = await claimsRes.json();
        setRecentClaims(claimsData.claims || []);
      }

      // Fetch notifications
      const notifRes = await fetch("/api/notifications?unreadOnly=true&limit=5");
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { text: string; className: string }> = {
      PENDING: { text: "รอตรวจสอบ", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      IN_REVIEW: { text: "กำลังตรวจสอบ", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      ADMIN_APPROVED: { text: "ผ่านการอนุมัติขั้นที่ 1", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
      MANAGER_APPROVED: { text: "อนุมัติแล้ว", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      REJECTED: { text: "ไม่อนุมัติ", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
      COMPLETED: { text: "เสร็จสิ้น", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" }
    };

    const config = statusConfig[status] || { text: status, className: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.text}
      </span>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ยินดีต้อนรับ, {session?.user?.firstName} {session?.user?.lastName}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          ภาพรวมสวัสดิการและคำร้องของคุณ
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/dashboard/welfare"
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ยื่นคำร้อง</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">ขอใช้สวัสดิการ</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/claims"
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">คำร้องของฉัน</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">ดูสถานะคำร้อง</p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/notifications"
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg relative">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">การแจ้งเตือน</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">แจ้งเตือนใหม่</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quota Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">โควตาสวัสดิการ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotas.map((quota) => (
            <div key={quota.welfareId} className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {quota.welfareName}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">ใช้ไปแล้ว</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {quota.usedAmount.toLocaleString()} บาท
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">คงเหลือ</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {quota.remainingAmount.toLocaleString()} บาท
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">วงเงินรวม</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {quota.totalQuota.toLocaleString()} บาท
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">ใช้ไป</span>
                    <span className="font-medium">{quota.usagePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        quota.usagePercentage >= 90 ? "bg-red-500" :
                        quota.usagePercentage >= 70 ? "bg-yellow-500" :
                        "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(quota.usagePercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {quotas.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              ไม่มีข้อมูลโควตาสวัสดิการ
            </div>
          )}
        </div>
      </div>

      {/* Recent Claims */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">คำร้องล่าสุด</h2>
          <Link
            href="/dashboard/claims"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ดูทั้งหมด →
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    วันที่ยื่น
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    สวัสดิการ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    จำนวนเงิน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {new Date(claim.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {claim.welfare.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {claim.amount.toLocaleString()} บาท
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(claim.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/dashboard/claims/${claim.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        ดูรายละเอียด
                      </Link>
                    </td>
                  </tr>
                ))}
                {recentClaims.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      ยังไม่มีคำร้อง
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">การแจ้งเตือนล่าสุด</h2>
            <Link
              href="/dashboard/notifications"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${notif.isRead ? "bg-gray-300" : "bg-blue-500"}`}></div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{notif.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      {new Date(notif.createdAt).toLocaleString("th-TH")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}