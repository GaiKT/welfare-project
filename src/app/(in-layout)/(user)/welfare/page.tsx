"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Welfare {
  id: string;
  name: string;
  description: string | null;
  budget: number;
  maxUsed: number;
  duration: number;
}

interface WelfareQuota {
  welfareId: string;
  welfareName: string;
  totalQuota: number;
  usedAmount: number;
  remainingAmount: number;
  usagePercentage: number;
}

export default function WelfarePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [welfares, setWelfares] = useState<Welfare[]>([]);
  const [quotas, setQuotas] = useState<WelfareQuota[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all welfare programs
      const welfareRes = await fetch("/api/welfare-management");
      if (welfareRes.ok) {
        const data = await welfareRes.json();
        setWelfares(data.welfarePrograms || []);
      }

      // Fetch user's quotas
      const quotaRes = await fetch("/api/quota/calculate");
      if (quotaRes.ok) {
        const data = await quotaRes.json();
        setQuotas(data.quotas || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getQuotaForWelfare = (welfareId: string) => {
    return quotas.find((q) => q.welfareId === welfareId);
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
          รายการสวัสดิการ
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          เลือกสวัสดิการที่ต้องการยื่นคำร้อง
        </p>
      </div>

      {/* Welfare Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {welfares.map((welfare) => {
          const quota = getQuotaForWelfare(welfare.id);
          const canApply = quota && quota.remainingAmount > 0;

          return (
            <div
              key={welfare.id}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              {/* Welfare Name */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {welfare.name}
              </h3>

              {/* Description */}
              {welfare.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {welfare.description}
                </p>
              )}

              {/* Welfare Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">วงเงินรวม:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {welfare.budget.toLocaleString()} บาท
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">สิทธิ์สูงสุด/คน:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {welfare.maxUsed.toLocaleString()} บาท
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">ระยะเวลา:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {welfare.duration} เดือน
                  </span>
                </div>
              </div>

              {/* Quota Information */}
              {quota && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">ใช้ไปแล้ว:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {quota.usedAmount.toLocaleString()} บาท
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">คงเหลือ:</span>
                      <span className={`font-medium ${canApply ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {quota.remainingAmount.toLocaleString()} บาท
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            quota.usagePercentage >= 90 ? "bg-red-500" :
                            quota.usagePercentage >= 70 ? "bg-yellow-500" :
                            "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(quota.usagePercentage, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                        ใช้ไป {quota.usagePercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {canApply ? (
                <Link
                  href={`/welfare/submit?welfareId=${welfare.id}`}
                  className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium rounded-lg transition-colors"
                >
                  ยื่นคำร้อง
                </Link>
              ) : (
                <button
                  disabled
                  className="block w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-center font-medium rounded-lg cursor-not-allowed"
                >
                  เต็มวงเงินแล้ว
                </button>
              )}
            </div>
          );
        })}

        {welfares.length === 0 && (
          <div className="col-span-full text-center py-12">
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              ไม่มีรายการสวัสดิการ
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              ขณะนี้ยังไม่มีสวัสดิการที่เปิดให้ใช้บริการ
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              ข้อมูลสำคัญ
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
              <ul className="list-disc list-inside space-y-1">
                <li>โควตาสวัสดิการคำนวณตามปีงบประมาณ (1 ก.ค. - 30 มิ.ย.)</li>
                <li>คำร้องจะต้องผ่านการอนุมัติจาก Admin และ Manager</li>
                <li>กรุณาแนบเอกสารประกอบให้ครบถ้วน</li>
                <li>สามารถติดตามสถานะคำร้องได้ที่เมนู "คำร้องของฉัน"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
