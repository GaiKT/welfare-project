"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageLoading, InlineLoading } from "@/components/ui/loading";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Briefcase,
  Wallet,
  Calculator,
  Calendar,
  Clock,
  Building2,
  Heart,
  User,
  FileText,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Send,
  FileImage,
  FileSpreadsheet,
  File,
  MessageSquare,
  CreditCard,
} from "lucide-react";

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

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (fileType.includes("word") || fileType.includes("document")) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    }
    if (fileType.includes("sheet") || fileType.includes("excel")) {
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    }
    if (fileType.includes("image")) {
      return <FileImage className="w-5 h-5 text-purple-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
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
        toast.success("ยื่นคำร้องสำเร็จ!");
        router.push("/claims");
      } else {
        setError(data.error || "เกิดข้อผิดพลาดในการยื่นคำร้อง");
        toast.error(data.error || "เกิดข้อผิดพลาดในการยื่นคำร้อง");
      }
    } catch (error) {
      console.error("Error submitting claim:", error);
      toast.error("เกิดข้อผิดพลาดในการยื่นคำร้อง");
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
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error || "ไม่พบข้อมูลประเภทสวัสดิการ"}</p>
          <Link
            href="/welfare"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้ารายการสวัสดิการ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/welfare"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          ย้อนกลับ
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
            <Send className="w-6 h-6" />
          </div>
          ยื่นคำร้องสวัสดิการ
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {subType.welfareType.name} - {subType.name}
        </p>
      </div>

      {/* Welfare Info Card */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-500" />
          ข้อมูลสวัสดิการ
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {/* Amount */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-l-4 border-blue-500 col-span-4 md:col-span-2">
            <label className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Wallet className="w-4 h-4" />
              จำนวนเงิน
            </label>
            <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(subType.amount)} <span className="text-sm font-normal">บาท</span>
              {subType.unitType === "PER_NIGHT" && <span className="text-sm font-normal">/คืน</span>}
              {subType.unitType === "PER_INCIDENT" && <span className="text-sm font-normal">/ครั้ง</span>}
            </p>
          </div>

          {/* Calculation Method */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl col-span-4 md:col-span-2">
            <label className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Calculator className="w-4 h-4" />
              วิธีคำนวณ
            </label>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {unitTypeLabels[subType.unitType]}
            </p>
          </div>

          {/* Max Per Request */}
          {subType.maxPerRequest && (
            <div className="p-4 bg-gradient-to-br from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl col-span-4 md:col-span-2">
              <label className="text-sm font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                <CreditCard className="w-4 h-4" />
                สูงสุด/ครั้ง
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {formatCurrency(subType.maxPerRequest)} <span className="text-sm font-normal">บาท</span>
              </p>
            </div>
          )}

          {/* Max Per Year */}
          {subType.maxPerYear && (
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl col-span-4 md:col-span-2">
              <label className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                สูงสุด/ปี
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {formatCurrency(subType.maxPerYear)} <span className="text-sm font-normal">บาท</span>
              </p>
            </div>
          )}

          {/* Max Claims Lifetime */}
          {subType.maxClaimsLifetime && (
            <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl col-span-4 md:col-span-2">
              <label className="text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                เบิกได้ตลอดชีพ
              </label>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {subType.maxClaimsLifetime} <span className="text-sm font-normal">ครั้ง</span>
              </p>
            </div>
          )}
        </div>

        {/* Quota Info */}
        {quota && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              โควตาคงเหลือของคุณ
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {quota.remainingPerYear !== null && (
                <div className={`p-3 rounded-xl ${quota.remainingPerYear > 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                  <p className={`text-sm ${quota.remainingPerYear > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    คงเหลือปีนี้
                  </p>
                  <p className={`text-lg font-bold ${quota.remainingPerYear > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                    {formatCurrency(quota.remainingPerYear)} บาท
                  </p>
                </div>
              )}
              {quota.remainingClaimsLifetime !== null && (
                <div className={`p-3 rounded-xl ${quota.remainingClaimsLifetime > 0 ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                  <p className={`text-sm ${quota.remainingClaimsLifetime > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                    เหลือสิทธิ์
                  </p>
                  <p className={`text-lg font-bold ${quota.remainingClaimsLifetime > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                    {quota.remainingClaimsLifetime} ครั้ง
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Nights Input - Only for PER_NIGHT type */}
        {subType.unitType === "PER_NIGHT" && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-500" />
              ข้อมูลการรักษาพยาบาล
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl">
                <label className="block text-sm font-medium text-teal-700 dark:text-teal-300 mb-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  จำนวนคืนที่เข้าพักรักษา <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.nights}
                  onChange={(e) => setFormData({ ...formData, nights: e.target.value })}
                  className="w-full px-4 py-3 border border-teal-200 dark:border-teal-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="จำนวนคืน"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    วันที่เข้ารับการรักษา
                  </label>
                  <input
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    วันที่ออกจากโรงพยาบาล
                  </label>
                  <input
                    type="date"
                    value={formData.dischargeDate}
                    onChange={(e) => setFormData({ ...formData, dischargeDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  ชื่อโรงพยาบาล
                </label>
                <input
                  type="text"
                  value={formData.hospitalName}
                  onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="ชื่อโรงพยาบาล"
                />
              </div>
            </div>
          </div>
        )}

        {/* Beneficiary Info - For certain welfare types */}
        {(subType.welfareType.code === "FUNERAL" || subType.welfareType.code === "NEWBORN") && (
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              ข้อมูลผู้รับสิทธิ์
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl">
                <label className="block text-sm font-medium text-rose-700 dark:text-rose-300 mb-2 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  ชื่อ-นามสกุล {subType.welfareType.code === "FUNERAL" ? "ผู้เสียชีวิต" : "บุตร"}
                </label>
                <input
                  type="text"
                  value={formData.beneficiaryName}
                  onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
                  className="w-full px-4 py-3 border border-rose-200 dark:border-rose-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
              <div className="p-4 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl">
                <label className="block text-sm font-medium text-rose-700 dark:text-rose-300 mb-2 flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  ความสัมพันธ์
                </label>
                <select
                  value={formData.beneficiaryRelation}
                  onChange={(e) => setFormData({ ...formData, beneficiaryRelation: e.target.value })}
                  className="w-full px-4 py-3 border border-rose-200 dark:border-rose-700 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
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
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl">
              <label className="block text-sm font-medium text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                วันที่เกิดเหตุการณ์
              </label>
              <input
                type="date"
                value={formData.incidentDate}
                onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                className="w-full px-4 py-3 border border-amber-200 dark:border-amber-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-blue-500" />
            จำนวนเงินที่ขอ
          </h3>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-l-4 border-blue-500">
            <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              จำนวนเงิน <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="0"
                value={formData.requestedAmount}
                onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all text-xl font-semibold ${
                  subType.unitType === "LUMP_SUM" 
                    ? "bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-600 cursor-not-allowed"
                    : "border-blue-200 dark:border-blue-700"
                }`}
                placeholder="0"
                readOnly={subType.unitType === "LUMP_SUM"}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">บาท</span>
            </div>
            {subType.unitType === "LUMP_SUM" && (
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Info className="w-4 h-4" />
                จำนวนเงินคงที่ตามประเภทสวัสดิการ
              </p>
            )}
            {subType.unitType === "PER_NIGHT" && (
              <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Calculator className="w-4 h-4" />
                คำนวณจากจำนวนคืน × {formatCurrency(subType.amount)} บาท {subType.maxPerRequest ? `(สูงสุด ${formatCurrency(subType.maxPerRequest)} บาท/ครั้ง)` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            รายละเอียดเพิ่มเติม
          </h3>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all resize-none"
            placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
          />
        </div>

        {/* Required Documents */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            แนบเอกสารประกอบ <span className="text-red-500">*</span>
          </h3>
          
          {/* Required Documents List */}
          {subType.welfareType.requiredDocuments.length > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                เอกสารที่ต้องแนบ:
              </p>
              <ul className="space-y-2">
                {subType.welfareType.requiredDocuments.map((doc) => (
                  <li key={doc.id} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    {doc.name}
                    {doc.isRequired && <span className="text-red-500 font-medium">*</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
            <Info className="w-4 h-4" />
            รองรับไฟล์: PDF, Word, Excel, รูปภาพ (สูงสุด 10MB/ไฟล์)
          </p>

          {/* File Upload Area */}
          <label className="block">
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <div className="text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-blue-600 dark:text-blue-400">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง
                </p>
              </div>
            </div>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          
          {/* File List */}
          {formData.files.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ไฟล์ที่เลือก ({formData.files.length} ไฟล์)
              </p>
              {formData.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700 dark:to-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 group hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
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
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <Link
            href="/welfare"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl transition-all font-medium flex items-center gap-2 shadow-md hover:shadow-lg disabled:shadow-none"
          >
            {submitting ? (
              <>
                <InlineLoading size="sm" />
                <span>กำลังยื่นคำร้อง...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>ยื่นคำร้อง</span>
              </>
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
