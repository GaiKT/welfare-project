"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageLoading } from "@/components/ui/loading";

interface Claim {
  id: string;
  welfareSubType: {
    code: string;
    name: string;
    amount: number;
    unitType: string;
    maxPerRequest: number | null;
    maxPerYear: number | null;
    maxLifetime: number | null;
    welfareType: {
      code: string;
      name: string;
    };
  };
  user: {
    identity: string;
    firstName: string;
    lastName: string;
    title: string | null;
  };
  requestedAmount: number;
  approvedAmount: number | null;
  nights: number | null;
  beneficiaryName: string | null;
  beneficiaryRelation: string | null;
  description: string | null;
  incidentDate: string | null;
  hospitalName: string | null;
  admissionDate: string | null;
  dischargeDate: string | null;
  status: string;
  fiscalYear: number;
  submittedDate: string;
  completedDate: string | null;
  rejectionReason: string | null;
  createdAt: string;
  _count: {
    comments: number;
  };
  documents: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }[];
}

export default function AdminClaimsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "IN_REVIEW">("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (session?.user && !session.user.role) {
      // User doesn't have AdminRole, redirect
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role) {
      // Only admins/managers have role property
      fetchClaims();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, filter]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      let url = "/api/claims";
      
      if (filter !== "ALL") {
        url += `?status=${filter}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setClaims(result.data?.claims || []);
        }
      }
    } catch (error) {
      console.error("Error fetching claims:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { text: string; className: string }> = {
      PENDING: {
        text: "รอตรวจสอบ",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
      IN_REVIEW: {
        text: "กำลังตรวจสอบ",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
    };

    const config = statusConfig[status] || {
      text: status,
      className: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-3 py-1 text-sm font-medium rounded-full ${config.className}`}
      >
        {config.text}
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
          คำร้องรอตรวจสอบ
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          จัดการคำร้องที่รอการอนุมัติจาก Admin
        </p>
      </div>

      {/* Stats Summary */}
      {claims.length > 0 && (
        <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              จำนวนคำร้อง
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {claims.length}
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              รอตรวจสอบ
            </div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
              {claims.filter((c) => c.status === "PENDING").length}
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              กำลังตรวจสอบ
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {claims.filter((c) => c.status === "IN_REVIEW").length}
            </div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "ALL"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => setFilter("PENDING")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "PENDING"
              ? "bg-yellow-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          รอตรวจสอบ
        </button>
        <button
          onClick={() => setFilter("IN_REVIEW")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "IN_REVIEW"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          กำลังตรวจสอบ
        </button>
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
                      {claim.welfareSubType.welfareType.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {claim.welfareSubType.name}
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
                      {claim.documents?.length || 0} ไฟล์
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {claim.requestedAmount.toLocaleString()} ฿
                    </span>
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
                      href={`/claims-admin/${claim.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      ตรวจสอบ
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
              {filter === "ALL"
                ? "ไม่มีคำร้องรอตรวจสอบ"
                : `ไม่มีคำร้องสถานะ ${
                    filter === "PENDING" ? "รอตรวจสอบ" : "กำลังตรวจสอบ"
                  }`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
