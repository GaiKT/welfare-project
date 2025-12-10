"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageLoading } from "@/components/ui/loading";

interface RequiredDocument {
  id: string;
  name: string;
  isRequired: boolean;
}

interface WelfareSubType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  amount: number;
  unitType: "LUMP_SUM" | "PER_NIGHT" | "PER_INCIDENT";
  maxPerRequest: number | null;
  maxPerYear: number | null;
  maxLifetime: number | null;
  maxClaimsLifetime: number | null;
  isActive: boolean;
}

interface WelfareType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  subTypes: WelfareSubType[];
  requiredDocuments: RequiredDocument[];
}

interface SubTypeQuota {
  subTypeId: string;
  subTypeCode: string;
  subTypeName: string;
  amount: number;
  unitType: string;
  maxPerRequest: number | null;
  maxPerYear: number | null;
  maxLifetime: number | null;
  maxClaimsLifetime: number | null;
  usedAmountYear: number;
  usedClaimsYear: number;
  usedAmountLifetime: number;
  usedClaimsLifetime: number;
  remainingPerYear: number | null;
  remainingLifetime: number | null;
  remainingClaimsLifetime: number | null;
  canClaim: boolean;
}

interface WelfareQuota {
  welfareTypeId: string;
  welfareTypeCode: string;
  welfareTypeName: string;
  description: string | null;
  subTypes: SubTypeQuota[];
}

const unitTypeLabels: Record<string, string> = {
  LUMP_SUM: "เหมาจ่าย",
  PER_NIGHT: "ต่อคืน",
  PER_INCIDENT: "ต่อครั้ง",
};

export default function WelfarePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [welfareTypes, setWelfareTypes] = useState<WelfareType[]>([]);
  const [quotas, setQuotas] = useState<WelfareQuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

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

      // Fetch all welfare types
      const welfareRes = await fetch("/api/welfare-management");
      if (welfareRes.ok) {
        const result = await welfareRes.json();
        if (result.success) {
          setWelfareTypes(result.data?.welfareTypes || []);
        }
      }

      // Fetch user's quotas
      const quotaRes = await fetch("/api/quota/calculate");
      if (quotaRes.ok) {
        const result = await quotaRes.json();
        if (result.success) {
          setQuotas(result.data?.quotas || []);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getQuotaForSubType = (subTypeId: string): SubTypeQuota | undefined => {
    for (const quota of quotas) {
      const subTypeQuota = quota.subTypes.find((st) => st.subTypeId === subTypeId);
      if (subTypeQuota) return subTypeQuota;
    }
    return undefined;
  };

  const toggleExpand = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
    }
    setExpandedTypes(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (status === "loading" || loading) {
    return <PageLoading text="กำลังโหลด..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          รายการสวัสดิการ
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          เลือกสวัสดิการที่ต้องการยื่นคำร้อง
        </p>
      </div>

      {/* Welfare Types */}
      <div className="space-y-4">
        {welfareTypes.map((welfareType) => (
          <div
            key={welfareType.id}
            className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/5 overflow-hidden"
          >
            {/* Type Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
              onClick={() => toggleExpand(welfareType.id)}
            >
              <div className="flex items-center gap-4">
                <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg
                    className={`w-5 h-5 transition-transform ${expandedTypes.has(welfareType.id) ? "rotate-90" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {welfareType.name}
                  </h3>
                  {welfareType.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {welfareType.description}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {welfareType.subTypes.length} ประเภทย่อย
              </span>
            </div>

            {/* Sub-types */}
            {expandedTypes.has(welfareType.id) && (
              <div className="border-t border-gray-200 dark:border-gray-800">
                <div className="p-4 space-y-3">
                  {welfareType.subTypes.map((subType) => {
                    const quota = getQuotaForSubType(subType.id);
                    const canClaim = quota?.canClaim !== false;

                    return (
                      <div
                        key={subType.id}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-800 dark:text-white">
                                {subType.name}
                              </h4>
                              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {unitTypeLabels[subType.unitType]}
                              </span>
                            </div>
                            
                            {/* Amount Info */}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                              <span>
                                <span className="font-semibold text-brand-600 dark:text-brand-400">
                                  {formatCurrency(subType.amount)}
                                </span>
                                {subType.unitType === "PER_NIGHT" && " บาท/คืน"}
                                {subType.unitType === "PER_INCIDENT" && " บาท/ครั้ง"}
                                {subType.unitType === "LUMP_SUM" && " บาท"}
                              </span>
                              {subType.maxPerRequest && (
                                <span>สูงสุด/ครั้ง: {formatCurrency(subType.maxPerRequest)} บาท</span>
                              )}
                              {subType.maxPerYear && (
                                <span>สูงสุด/ปี: {formatCurrency(subType.maxPerYear)} บาท</span>
                              )}
                              {subType.maxLifetime && (
                                <span>สูงสุดตลอด: {formatCurrency(subType.maxLifetime)} บาท</span>
                              )}
                              {subType.maxClaimsLifetime && (
                                <span>เบิกได้ {subType.maxClaimsLifetime} ครั้งตลอดชีพ</span>
                              )}
                            </div>

                            {/* Quota Info */}
                            {quota && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                                {quota.maxPerYear && (
                                  <div className="flex items-center gap-2">
                                    <span>ใช้ไปปีนี้:</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      {formatCurrency(quota.usedAmountYear)} / {formatCurrency(quota.maxPerYear)} บาท
                                    </span>
                                    {quota.remainingPerYear !== null && (
                                      <span className={quota.remainingPerYear > 0 ? "text-green-600" : "text-red-600"}>
                                        (เหลือ {formatCurrency(quota.remainingPerYear)} บาท)
                                      </span>
                                    )}
                                  </div>
                                )}
                                {quota.maxClaimsLifetime && (
                                  <div className="flex items-center gap-2">
                                    <span>ใช้สิทธิ์ไปแล้ว:</span>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      {quota.usedClaimsLifetime} / {quota.maxClaimsLifetime} ครั้ง
                                    </span>
                                    {quota.remainingClaimsLifetime !== null && (
                                      <span className={quota.remainingClaimsLifetime > 0 ? "text-green-600" : "text-red-600"}>
                                        (เหลือ {quota.remainingClaimsLifetime} ครั้ง)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Action */}
                          <div className="flex">
                            {canClaim ? (
                              <Link
                                href={`/welfare/submit?subTypeId=${subType.id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                ยื่นคำร้อง
                              </Link>
                            ) : (
                              <button
                                disabled
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed"
                              >
                                เต็มสิทธิ์แล้ว
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Required Documents */}
                {welfareType.requiredDocuments.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      เอกสารที่ต้องแนบ:
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {welfareType.requiredDocuments.map((doc) => (
                        <span
                          key={doc.id}
                          className="inline-flex items-center px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                          {doc.name}
                          {doc.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {welfareTypes.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/5 p-12 text-center">
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
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex">
          <div className="flex">
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
                <li>กรุณาแนบเอกสารประกอบให้ครบถ้วน (เอกสารที่มีเครื่องหมาย * จำเป็นต้องแนบ)</li>
                <li>สามารถติดตามสถานะคำร้องได้ที่เมนู &quot;คำร้องของฉัน&quot;</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
