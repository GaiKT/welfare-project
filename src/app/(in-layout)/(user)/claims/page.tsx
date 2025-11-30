"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Claim {
  id: string;
  welfare: {
    name: string;
  };
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  _count: {
    documents: number;
  };
}

export default function MyClaimsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchClaims();
    }
  }, [session, filter]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "ALL") {
        params.append("status", filter);
      }

      const response = await fetch(`/api/claims?${params.toString()}`);
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
    const statusConfig: Record<string, { text: string; className: string }> = {
      PENDING: { text: "รอตรวจสอบ", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
      IN_REVIEW: { text: "กำลังตรวจสอบ", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
      ADMIN_APPROVED: { text: "ผ่าน Admin", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
      MANAGER_APPROVED: { text: "อนุมัติแล้ว", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
      REJECTED: { text: "ไม่อนุมัติ", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
      COMPLETED: { text: "เสร็จสิ้น", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" }
    };

    const config = statusConfig[status] || { text: status, className: "bg-gray-100 text-gray-800" };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.text}
      </span>
    );
  };

  // const getStatusCount = (status: string) => {
  //   if (status === "ALL") return claims.length;
  //   return claims.filter((c) => c.status === status).length;
  // };

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
          คำร้องของฉัน
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          ติดตามสถานะและจัดการคำร้องสวัสดิการของคุณ
        </p>
      </div>

      {/* Status Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        {[
          { key: "ALL", label: "ทั้งหมด" },
          { key: "PENDING", label: "รอตรวจสอบ" },
          { key: "IN_REVIEW", label: "กำลังตรวจสอบ" },
          { key: "ADMIN_APPROVED", label: "ผ่าน Admin" },
          { key: "MANAGER_APPROVED", label: "อนุมัติแล้ว" },
          { key: "REJECTED", label: "ไม่อนุมัติ" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === item.key
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            {item.label}
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-opacity-20 bg-gray-900 dark:bg-white">
              {filter === "ALL" && item.key === "ALL" ? claims.length : ""}
            </span>
          </button>
        ))}
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            ไม่มีคำร้อง
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filter !== "ALL" ? "ไม่มีคำร้องในสถานะนี้" : "คุณยังไม่มีคำร้องสวัสดิการ"}
          </p>
          <div className="mt-6">
            <Link
              href="/welfare"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              ยื่นคำร้องใหม่
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {claims.map((claim) => (
            <Link
              key={claim.id}
              href={`/claims/${claim.id}`}
              className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {claim.welfare.name}
                    </h3>
                    {getStatusBadge(claim.status)}
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {claim.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {claim.amount.toLocaleString()} บาท
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                      {claim._count.documents} ไฟล์
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(claim.createdAt).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
