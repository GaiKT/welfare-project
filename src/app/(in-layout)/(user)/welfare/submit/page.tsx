"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageLoading, InlineLoading } from "@/components/ui/loading";

interface RequiredDocument {
  id: string;
  name: string;
  description: string | null;
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
  welfareType: {
    id: string;
    code: string;
    name: string;
    requiredDocuments: RequiredDocument[];
  };
}

interface SubTypeQuota {
  subTypeId: string;
  usedAmountYear: number;
  usedClaimsYear: number;
  usedAmountLifetime: number;
  usedClaimsLifetime: number;
  remainingPerYear: number | null;
  remainingLifetime: number | null;
  remainingClaimsLifetime: number | null;
  canClaim: boolean;
}

const unitTypeLabels: Record<string, string> = {
  LUMP_SUM: "เหมาจ่าย",
  PER_NIGHT: "ต่อคืน",
  PER_INCIDENT: "ต่อครั้ง",
};

function SubmitClaimForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subTypeId = searchParams.get("subTypeId");

  const [subType, setSubType] = useState<WelfareSubType | null>(null);
  const [quota, setQuota] = useState<SubTypeQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    requestedAmount: "",
    description: "",
    nights: "",
    beneficiaryName: "",
    beneficiaryRelation: "SELF",
    incidentDate: "",
    hospitalName: "",
    admissionDate: "",
    dischargeDate: "",
    files: [] as File[],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (!subTypeId) {
      router.push("/welfare");
      return;
    }

    if (session?.user) {
      fetchSubTypeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTypeId, session]);

  const fetchSubTypeData = async () => {
    try {
      setLoading(true);

      // Fetch sub-type details
      const res = await fetch(`/api/welfare-management/sub-types/${subTypeId}`);
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setSubType(result.data);
        } else {
          setError("ไม่พบข้อมูลประเภทสวัสดิการ");
          return;
        }
      } else {
        setError("ไม่พบข้อมูลประเภทสวัสดิการ");
        return;
      }

      // Fetch quota
      const quotaRes = await fetch("/api/quota/calculate");
      if (quotaRes.ok) {
        const quotaResult = await quotaRes.json();
        if (quotaResult.success) {
          // Find the quota for this sub-type
          for (const wt of quotaResult.data?.quotas || []) {
            const stQuota = wt.subTypes.find((st: SubTypeQuota) => st.subTypeId === subTypeId);
            if (stQuota) {
              setQuota(stQuota);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  // Calculate amount based on type
  useEffect(() => {
    if (!subType) return;

    if (subType.unitType === "LUMP_SUM") {
      setFormData((prev) => ({ ...prev, requestedAmount: subType.amount.toString() }));
    } else if (subType.unitType === "PER_NIGHT" && formData.nights) {
      const nights = parseInt(formData.nights);
      if (!isNaN(nights)) {
        let amount = nights * subType.amount;
        if (subType.maxPerRequest && amount > subType.maxPerRequest) {
          amount = subType.maxPerRequest;
        }
        setFormData((prev) => ({ ...prev, requestedAmount: amount.toString() }));
      }
    }
  }, [subType, formData.nights]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData((prev) => ({ ...prev, files: [...prev.files, ...newFiles] }));
    }
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!subType || !subTypeId) {
      setError("ข้อมูลสวัสดิการไม่ครบถ้วน");
      return;
    }

    const requestedAmount = parseFloat(formData.requestedAmount);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      setError("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }

    if (subType.maxPerRequest && requestedAmount > subType.maxPerRequest) {
      setError(`จำนวนเงินเกินสิทธิ์สูงสุดต่อครั้ง (${subType.maxPerRequest.toLocaleString()} บาท)`);
      return;
    }

    if (quota?.remainingPerYear !== null && quota?.remainingPerYear !== undefined && requestedAmount > quota.remainingPerYear) {
      setError(`จำนวนเงินเกินโควตาคงเหลือปีนี้ (${quota.remainingPerYear.toLocaleString()} บาท)`);
      return;
    }

    if (formData.files.length === 0) {
      setError("กรุณาแนบเอกสารอย่างน้อย 1 ไฟล์");
      return;
    }

    // Validate nights for PER_NIGHT type
    if (subType.unitType === "PER_NIGHT" && !formData.nights) {
      setError("กรุณาระบุจำนวนคืนที่เข้าพักรักษา");
      return;
    }

    try {
      setSubmitting(true);

      const submitFormData = new FormData();
      submitFormData.append("welfareSubTypeId", subTypeId);
      submitFormData.append("requestedAmount", requestedAmount.toString());
      submitFormData.append("description", formData.description);

      if (formData.nights) {
        submitFormData.append("nights", formData.nights);
      }
      if (formData.beneficiaryName) {
        submitFormData.append("beneficiaryName", formData.beneficiaryName);
      }
      submitFormData.append("beneficiaryRelation", formData.beneficiaryRelation);
      if (formData.incidentDate) {
        submitFormData.append("incidentDate", formData.incidentDate);
      }
      if (formData.hospitalName) {
        submitFormData.append("hospitalName", formData.hospitalName);
      }
      if (formData.admissionDate) {
        submitFormData.append("admissionDate", formData.admissionDate);
      }
      if (formData.dischargeDate) {
        submitFormData.append("dischargeDate", formData.dischargeDate);
      }

      formData.files.forEach((file) => {
        submitFormData.append("files", file);
      });

      const response = await fetch("/api/claims/submit", {
        method: "POST",
        body: submitFormData,
      });

      const data = await response.json();

      if (response.ok) {
        alert("ยื่นคำร้องสำเร็จ!");
        router.push("/claims");
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการยื่นคำร้อง");
      }
    } catch (error) {
      console.error("Error submitting claim:", error);
      setError("เกิดข้อผิดพลาดในการยื่นคำร้อง");
    } finally {
      setSubmitting(false);
    }
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

  if (!subType) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || "ไม่พบข้อมูลประเภทสวัสดิการ"}</p>
          <Link
            href="/welfare"
            className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
          >
            กลับไปหน้ารายการสวัสดิการ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/welfare"
          className="text-brand-600 dark:text-brand-400 hover:underline mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          กลับ
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          ยื่นคำร้อง - {subType.welfareType.name}
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          {subType.name}
        </p>
      </div>

      {/* Welfare Info */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          ข้อมูลสวัสดิการ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">จำนวนเงิน</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(subType.amount)} บาท
              {subType.unitType === "PER_NIGHT" && "/คืน"}
              {subType.unitType === "PER_INCIDENT" && "/ครั้ง"}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">วิธีคำนวณ</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {unitTypeLabels[subType.unitType]}
            </p>
          </div>
          {subType.maxPerRequest && (
            <div>
              <p className="text-gray-600 dark:text-gray-400">สูงสุด/ครั้ง</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(subType.maxPerRequest)} บาท
              </p>
            </div>
          )}
          {subType.maxPerYear && (
            <div>
              <p className="text-gray-600 dark:text-gray-400">สูงสุด/ปี</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(subType.maxPerYear)} บาท
              </p>
            </div>
          )}
          {subType.maxClaimsLifetime && (
            <div>
              <p className="text-gray-600 dark:text-gray-400">เบิกได้</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {subType.maxClaimsLifetime} ครั้งตลอดชีพ
              </p>
            </div>
          )}
          {quota && (
            <>
              {quota.remainingPerYear !== null && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">คงเหลือปีนี้</p>
                  <p className={`font-semibold ${quota.remainingPerYear > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {formatCurrency(quota.remainingPerYear)} บาท
                  </p>
                </div>
              )}
              {quota.remainingClaimsLifetime !== null && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">เหลือสิทธิ์</p>
                  <p className={`font-semibold ${quota.remainingClaimsLifetime > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {quota.remainingClaimsLifetime} ครั้ง
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Nights Input - Only for PER_NIGHT type */}
        {subType.unitType === "PER_NIGHT" && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              จำนวนคืนที่เข้าพักรักษา <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.nights}
              onChange={(e) => setFormData({ ...formData, nights: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
              placeholder="จำนวนคืน"
              required
            />
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  วันที่เข้ารับการรักษา
                </label>
                <input
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  วันที่ออกจากโรงพยาบาล
                </label>
                <input
                  type="date"
                  value={formData.dischargeDate}
                  onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ชื่อโรงพยาบาล
              </label>
              <input
                type="text"
                value={formData.hospitalName}
                onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
                placeholder="ชื่อโรงพยาบาล"
              />
            </div>
          </div>
        )}

        {/* Beneficiary Info - For certain welfare types */}
        {(subType.welfareType.code === "FUNERAL" || subType.welfareType.code === "NEWBORN") && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5 p-4">
            <h4 className="font-medium text-gray-800 dark:text-white mb-3">ข้อมูลผู้รับสิทธิ์</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ชื่อ-นามสกุล {subType.welfareType.code === "FUNERAL" ? "ผู้เสียชีวิต" : "บุตร"}
                </label>
                <input
                  type="text"
                  value={formData.beneficiaryName}
                  onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ความสัมพันธ์
                </label>
                <select
                  value={formData.beneficiaryRelation}
                  onChange={(e) => setFormData({ ...formData, beneficiaryRelation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="SELF">ตนเอง</option>
                  <option value="SPOUSE">คู่สมรส</option>
                  <option value="CHILD">บุตร</option>
                  <option value="FATHER">บิดา</option>
                  <option value="MOTHER">มารดา</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Incident Date - For certain welfare types */}
        {(subType.welfareType.code === "FUNERAL" || subType.welfareType.code === "DISASTER" || subType.welfareType.code === "MARRIAGE") && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              วันที่เกิดเหตุการณ์
            </label>
            <input
              type="date"
              value={formData.incidentDate}
              onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
            />
          </div>
        )}

        {/* Amount */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            จำนวนเงินที่ขอ <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="1"
              min="0"
              value={formData.requestedAmount}
              onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
              placeholder="0"
              readOnly={subType.unitType === "LUMP_SUM"}
              required
            />
            <span className="absolute right-4 top-2.5 text-gray-500 dark:text-gray-400">บาท</span>
          </div>
          {subType.unitType === "LUMP_SUM" && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              * จำนวนเงินคงที่ตามประเภทสวัสดิการ
            </p>
          )}
          {subType.unitType === "PER_NIGHT" && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              * คำนวณจากจำนวนคืน × {formatCurrency(subType.amount)} บาท (สูงสุด {subType.maxPerRequest ? formatCurrency(subType.maxPerRequest) : "-"} บาท/ครั้ง)
            </p>
          )}
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            รายละเอียดเพิ่มเติม
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:text-white"
            placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
          />
        </div>

        {/* Required Documents */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/5 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            แนบเอกสารประกอบ <span className="text-red-500">*</span>
          </label>
          
          {/* Required Documents List */}
          {subType.welfareType.requiredDocuments.length > 0 && (
            <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                เอกสารที่ต้องแนบ:
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                {subType.welfareType.requiredDocuments.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {doc.name}
                    {doc.isRequired && <span className="text-red-500">*</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            รองรับไฟล์: PDF, Word, Excel, รูปภาพ (สูงสุด 10MB/ไฟล์)
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900 dark:file:text-brand-300"
          />
          
          {/* File List */}
          {formData.files.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <svg
                      className="w-5 h-5 text-gray-400"
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
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/welfare"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <InlineLoading size="sm" />
                <span>กำลังยื่นคำร้อง...</span>
              </>
            ) : (
              <span>ยื่นคำร้อง</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SubmitClaimPage() {
  return (
    <Suspense fallback={<PageLoading text="กำลังโหลด..." />}>
      <SubmitClaimForm />
    </Suspense>
  );
}
