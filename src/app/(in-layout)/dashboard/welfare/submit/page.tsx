"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function SubmitClaimForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const welfareId = searchParams.get("welfareId");

  const [welfare, setWelfare] = useState<Welfare | null>(null);
  const [quota, setQuota] = useState<WelfareQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    files: [] as File[],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (!welfareId) {
      router.push("/dashboard/welfare");
      return;
    }

    if (session?.user) {
      fetchWelfareData();
    }
  }, [welfareId, session]);

  const fetchWelfareData = async () => {
    try {
      setLoading(true);

      // Fetch welfare details
      const welfareRes = await fetch(`/api/welfare-management/${welfareId}`);
      if (welfareRes.ok) {
        const data = await welfareRes.json();
        setWelfare(data.welfare);
      } else {
        setError("ไม่พบข้อมูลสวัสดิการ");
        return;
      }

      // Fetch quota
      const quotaRes = await fetch("/api/quota/calculate");
      if (quotaRes.ok) {
        const data = await quotaRes.json();
        const matchedQuota = data.quotas.find((q: WelfareQuota) => q.welfareId === welfareId);
        setQuota(matchedQuota || null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

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

    if (!welfare || !welfareId) {
      setError("ข้อมูลสวัสดิการไม่ครบถ้วน");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("กรุณาระบุจำนวนเงินที่ถูกต้อง");
      return;
    }

    if (quota && amount > quota.remainingAmount) {
      setError(`จำนวนเงินเกินโควตาคงเหลือ (${quota.remainingAmount.toLocaleString()} บาท)`);
      return;
    }

    if (amount > welfare.maxUsed) {
      setError(`จำนวนเงินเกินสิทธิ์สูงสุดต่อครั้ง (${welfare.maxUsed.toLocaleString()} บาท)`);
      return;
    }

    if (!formData.description.trim()) {
      setError("กรุณาระบุรายละเอียด");
      return;
    }

    if (formData.files.length === 0) {
      setError("กรุณาแนบเอกสารอย่างน้อย 1 ไฟล์");
      return;
    }

    try {
      setSubmitting(true);

      const submitFormData = new FormData();
      submitFormData.append("welfareId", welfareId);
      submitFormData.append("amount", amount.toString());
      submitFormData.append("description", formData.description);

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
        router.push("/dashboard/claims");
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

  if (!welfare) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || "ไม่พบข้อมูลสวัสดิการ"}</p>
          <Link
            href="/dashboard/welfare"
            className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
          >
            กลับไปหน้ารายการสวัสดิการ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/welfare"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← กลับ
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          ยื่นคำร้อง - {welfare.name}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          กรุณากรอกข้อมูลและแนบเอกสารประกอบ
        </p>
      </div>

      {/* Welfare Info */}
      <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          ข้อมูลสวัสดิการ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">วงเงินรวม</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {welfare.budget.toLocaleString()} บาท
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">สิทธิ์สูงสุด/คน</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {welfare.maxUsed.toLocaleString()} บาท
            </p>
          </div>
          {quota && (
            <>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">ใช้ไปแล้ว</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {quota.usedAmount.toLocaleString()} บาท
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">คงเหลือ</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {quota.remainingAmount.toLocaleString()} บาท
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Amount */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            จำนวนเงินที่ขอ <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              max={Math.min(welfare.maxUsed, quota?.remainingAmount || welfare.maxUsed)}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="0.00"
              required
            />
            <span className="absolute right-4 top-2.5 text-gray-500 dark:text-gray-400">บาท</span>
          </div>
          {quota && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              คงเหลือ: {quota.remainingAmount.toLocaleString()} บาท
            </p>
          )}
        </div>

        {/* Description */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            รายละเอียดคำร้อง <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="กรุณาระบุรายละเอียดคำร้อง เช่น เหตุผล วัตถุประสงค์ ฯลฯ"
            required
          />
        </div>

        {/* File Upload */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            แนบเอกสารประกอบ <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            รองรับไฟล์: PDF, Word, Excel, รูปภาพ (สูงสุด 10MB/ไฟล์)
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300"
          />
          
          {/* File List */}
          {formData.files.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
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
            href="/dashboard/welfare"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitClaimForm />
    </Suspense>
  );
}
