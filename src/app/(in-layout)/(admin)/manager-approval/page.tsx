"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageLoading } from "@/components/ui/loading";

interface Claim {
  id: string;
  welfare: {
    id: string;
    name: string;
  };
  user: {
    identity: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  adminApprovedAt: string | null;
  adminApprover: {
    name: string;
  } | null;
  _count: {
    documents: number;
  };
}

export default function ManagerApprovalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (session?.user?.role && session.user.role !== "MANAGER") {
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === "MANAGER") {
      fetchClaims();
    }
  }, [session]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/claims?status=ADMIN_APPROVED");
      if (response.ok) {
        const data = await response.json();
        setClaims(data.claims || []);
      }
    } catch (error) {
      console.error("Error fetching claims:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className="px-3 py-1 text-sm font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
        รออนุมัติขั้นสุดท้าย
      </span>
    );
  };

  if (status === "loading" || loading) {
    return <PageLoading text="กำลังโหลด..." fullScreen />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          คำร้องรออนุมัติขั้นสุดท้าย
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          จัดการคำร้องที่ผ่านการอนุมัติจาก Admin แล้ว รอการอนุมัติจาก Manager
        </p>
      </div>

      {/* Claims Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ผู้ยื่นคำร้อง
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  สวัสดิการ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  จำนวนเงิน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Admin ผู้อนุมัติ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  สถานะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  วันที่ยื่น
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  การดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {claims.map((claim) => (
                <tr
                  key={claim.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {claim.user.firstName} {claim.user.lastName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {claim.user.identity}
                      </span>
                      {claim.user.title && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {claim.user.title}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {claim.welfare.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {claim._count.documents} ไฟล์
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {claim.amount.toLocaleString()} ฿
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {claim.adminApprover?.name || "-"}
                      </span>
                      {claim.adminApprovedAt && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(claim.adminApprovedAt).toLocaleDateString("th-TH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(claim.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {new Date(claim.createdAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(claim.createdAt).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/manager-approval/${claim.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                      พิจารณา
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {claims.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              ไม่มีคำร้องรออนุมัติขั้นสุดท้าย
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              คำร้องที่ผ่านการอนุมัติจาก Admin จะแสดงที่นี่
            </p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {claims.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              คำร้องทั้งหมด
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {claims.length}
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              จำนวนเงินรวม
            </div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {claims.reduce((sum, claim) => sum + claim.amount, 0).toLocaleString()} ฿
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              รอดำเนินการ
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
              {claims.filter((c) => c.status === "ADMIN_APPROVED").length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
