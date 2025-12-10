"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PageLoading } from "@/components/ui/loading";
import {
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Briefcase,
  Calendar,
  Wallet,
  Building2,
  Heart,
  AlertTriangle,
  MessageSquare,
  BadgeCheck,
  Info,
  CreditCard,
  Mail,
  Phone,
  IdCard,
  Check,
  X,
  Loader2,
} from "lucide-react";

// Types based on Prisma schema
interface ClaimDocument {
  id: string;
  documentName?: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

interface ClaimApproval {
  id: string;
  status: string;
  approverRole: string;
  comments: string | null;
  approvedAt: string;
  approver: {
    name: string;
    username: string;
    role: string;
    signatureUrl?: string | null;
  };
}

interface ClaimComment {
  id: string;
  comment: string;
  userType: "ADMIN" | "USER";
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  } | null;
}

interface RequiredDocument {
  id: string;
  name: string;
  isRequired: boolean;
}

interface WelfareSubType {
  id: string;
  code: string;
  name: string;
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

interface ClaimUser {
  id: string;
  identity: string;
  firstName: string;
  lastName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
}

interface Approver {
  id: string;
  name: string;
  username: string;
  signatureUrl: string | null;
}

interface ClaimDetail {
  id: string;
  welfareSubType: WelfareSubType;
  user: ClaimUser;
  requestedAmount: number;
  approvedAmount: number | null;
  nights: number | null;
  beneficiaryName: string | null;
  beneficiaryRelation: "SELF" | "SPOUSE" | "CHILD" | "FATHER" | "MOTHER" | null;
  description: string | null;
  incidentDate: string | null;
  hospitalName: string | null;
  admissionDate: string | null;
  dischargeDate: string | null;
  status: "PENDING" | "IN_REVIEW" | "ADMIN_APPROVED" | "MANAGER_APPROVED" | "REJECTED" | "COMPLETED";
  fiscalYear: number;
  submittedDate: string;
  createdAt: string;
  documents: ClaimDocument[];
  approvals: ClaimApproval[];
  comments: ClaimComment[];
  adminApprover: Approver | null;
  managerApprover: Approver | null;
  adminApprovedAt: string | null;
  managerApprovedAt?: string | null;
  completedDate: string | null;
  rejectionReason: string | null;
}

export default function AdminClaimDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const claimId = params.id as string;

  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  
  // Modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState<string>("");
  const [approveComment, setApproveComment] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (session?.user && !session.user.role) {
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role && claimId) {
      fetchClaimDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, claimId]);

  const fetchClaimDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/claims/${claimId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setClaim(result.data?.claim);
        } else {
          setError(result.error || "ไม่พบข้อมูลคำร้อง");
        }
      } else {
        setError("ไม่พบข้อมูลคำร้อง");
      }
    } catch (error) {
      console.error("Error fetching claim:", error);
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    // Open approve modal for both Admin and Manager
    setApprovedAmount(claim?.requestedAmount?.toString() || "");
    setApproveComment("");
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
    try {
      setProcessing(true);
      
      // For Manager, call manager-approve endpoint
      if (session?.user?.role === "MANAGER") {
        if (!approvedAmount || parseFloat(approvedAmount) <= 0) {
          alert("กรุณาระบุจำนวนเงินที่อนุมัติ");
          setProcessing(false);
          return;
        }
        
        const response = await fetch(`/api/claims/${claimId}/manager-approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comments: approveComment || undefined,
            approvedAmount: parseFloat(approvedAmount),
          }),
        });

        if (response.ok) {
          setShowApproveModal(false);
          setApproveComment("");
          setApprovedAmount("");
          fetchClaimDetail();
        } else {
          const data = await response.json();
          alert(data.error || "เกิดข้อผิดพลาดในการอนุมัติ");
        }
      } else {
        // For Admin
        const response = await fetch(`/api/claims/${claimId}/admin-approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comments: approveComment || undefined }),
        });

        if (response.ok) {
          setShowApproveModal(false);
          setApproveComment("");
          fetchClaimDetail();
        } else {
          const data = await response.json();
          alert(data.error || "เกิดข้อผิดพลาดในการอนุมัติ");
        }
      }
    } catch (error) {
      console.error("Error approving claim:", error);
      alert("เกิดข้อผิดพลาดในการอนุมัติ");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("กรุณาระบุเหตุผลในการปฏิเสธ");
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/claims/${claimId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason }),
      });

      if (response.ok) {
        setShowRejectModal(false);
        setRejectionReason("");
        fetchClaimDetail();
      } else {
        const data = await response.json();
        alert(data.error || "เกิดข้อผิดพลาดในการปฏิเสธ");
      }
    } catch (error) {
      console.error("Error rejecting claim:", error);
      alert("เกิดข้อผิดพลาดในการปฏิเสธ");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { text: string; className: string; icon: React.ReactNode }> = {
      PENDING: {
        text: "รอตรวจสอบ",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
        icon: <Clock className="w-4 h-4" />,
      },
      IN_REVIEW: {
        text: "กำลังตรวจสอบ",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
        icon: <Info className="w-4 h-4" />,
      },
      ADMIN_APPROVED: {
        text: "ผ่านการอนุมัติขั้นที่ 1",
        className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800",
        icon: <BadgeCheck className="w-4 h-4" />,
      },
      MANAGER_APPROVED: {
        text: "อนุมัติแล้ว",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        icon: <CheckCircle2 className="w-4 h-4" />,
      },
      REJECTED: {
        text: "ไม่อนุมัติ",
        className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800",
        icon: <XCircle className="w-4 h-4" />,
      },
      COMPLETED: {
        text: "เสร็จสิ้น",
        className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
        icon: <CheckCircle2 className="w-4 h-4" />,
      },
    };

    const config = statusConfig[status] || {
      text: status,
      className: "bg-gray-100 text-gray-800 border border-gray-200",
      icon: <Info className="w-4 h-4" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${config.className}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    if (fileType.includes("word") || fileType.includes("document")) {
      return <FileText className="w-8 h-8 text-blue-500" />;
    }
    if (fileType.includes("sheet") || fileType.includes("excel")) {
      return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    }
    if (fileType.includes("image")) {
      return <FileImage className="w-8 h-8 text-purple-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const getBeneficiaryRelationText = (relation: string | null) => {
    const relationMap: Record<string, string> = {
      SELF: "ตนเอง",
      SPOUSE: "คู่สมรส",
      CHILD: "บุตร",
      FATHER: "บิดา",
      MOTHER: "มารดา",
    };
    return relation ? relationMap[relation] || relation : "-";
  };

  const canApprove = () => {
    if (!claim) return false;
    if (session?.user?.role === "ADMIN") {
      return claim.status === "PENDING" || claim.status === "IN_REVIEW";
    }
    if (session?.user?.role === "MANAGER") {
      return claim.status === "ADMIN_APPROVED";
    }
    return false;
  };

  const canReject = () => {
    if (!claim) return false;
    return ["PENDING", "IN_REVIEW", "ADMIN_APPROVED"].includes(claim.status);
  };

  // Check if claim is already processed (approved, rejected, or completed)
  const isProcessed = () => {
    if (!claim) return false;
    return ["MANAGER_APPROVED", "REJECTED", "COMPLETED"].includes(claim.status);
  };

  if (status === "loading" || loading) {
    return <PageLoading text="กำลังโหลด..." fullScreen />;
  }

  if (error || !claim) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error || "ไม่พบข้อมูลคำร้อง"}</p>
          <Link
            href="/claims-admin"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้ารายการคำร้อง
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/claims-admin"
          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          กลับ
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                <FileText className="w-6 h-6" />
              </div>
              รายละเอียดคำร้อง
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              รหัสคำร้อง: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{claim.id.substring(0, 8)}</span>
            </p>
          </div>
          {getStatusBadge(claim.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Info */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              ข้อมูลผู้ยื่นคำร้อง
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                <label className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  ชื่อ-นามสกุล
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {claim.user.firstName} {claim.user.lastName}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                <label className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <IdCard className="w-4 h-4" />
                  รหัสพนักงาน
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{claim.user.identity}</p>
              </div>
              {claim.user.title && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    ตำแหน่ง
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">{claim.user.title}</p>
                </div>
              )}
              {claim.user.email && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    อีเมล
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">{claim.user.email}</p>
                </div>
              )}
              {claim.user.phone && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    เบอร์โทร
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">{claim.user.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Claim Info */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-500" />
              ข้อมูลคำร้อง
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
                  <label className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    ประเภทสวัสดิการ
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{claim.welfareSubType.welfareType.name}</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                  <label className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    หมวดย่อย
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                    {claim.welfareSubType.name}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border-l-4 border-blue-500">
                  <label className="text-sm font-medium text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                    <Wallet className="w-4 h-4" />
                    จำนวนเงินที่ขอเบิก
                  </label>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {claim.requestedAmount.toLocaleString()} <span className="text-sm font-normal">บาท</span>
                  </p>
                </div>
                {claim.approvedAmount && (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border-l-4 border-emerald-500">
                    <label className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      จำนวนเงินที่อนุมัติ
                    </label>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {claim.approvedAmount.toLocaleString()} <span className="text-sm font-normal">บาท</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {claim.description && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    รายละเอียด
                  </label>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap mt-2">
                    {claim.description}
                  </p>
                </div>
              )}

              {/* Beneficiary Info */}
              {claim.beneficiaryName && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
                  <div>
                    <label className="text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      ชื่อผู้เสียชีวิต
                    </label>
                    <p className="text-gray-900 dark:text-white mt-1">{claim.beneficiaryName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <User className="w-4 h-4" />
                      ความสัมพันธ์
                    </label>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {getBeneficiaryRelationText(claim.beneficiaryRelation)}
                    </p>
                  </div>
                </div>
              )}

              {/* Hospital Info */}
              {claim.hospitalName && (
                <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
                  <div className="mb-4">
                    <label className="text-sm font-medium text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      โรงพยาบาล
                    </label>
                    <p className="text-gray-900 dark:text-white mt-1 font-medium">{claim.hospitalName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {claim.admissionDate && (
                      <div>
                        <label className="text-sm font-medium text-teal-600 dark:text-teal-400 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          วันที่เข้าพัก
                        </label>
                        <p className="text-gray-900 dark:text-white mt-1">
                          {new Date(claim.admissionDate).toLocaleDateString("th-TH")}
                        </p>
                      </div>
                    )}
                    {claim.dischargeDate && (
                      <div>
                        <label className="text-sm font-medium text-teal-600 dark:text-teal-400 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          วันที่ออก
                        </label>
                        <p className="text-gray-900 dark:text-white mt-1">
                          {new Date(claim.dischargeDate).toLocaleDateString("th-TH")}
                        </p>
                      </div>
                    )}
                    {claim.nights && (
                      <div>
                        <label className="text-sm font-medium text-teal-600 dark:text-teal-400">
                          จำนวนคืน
                        </label>
                        <p className="text-gray-900 dark:text-white mt-1">{claim.nights} คืน</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Incident Date */}
              {claim.incidentDate && (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <label className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    วันที่เกิดเหตุ
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {new Date(claim.incidentDate).toLocaleDateString("th-TH")}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    ปีงบประมาณ
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1 font-medium">{claim.fiscalYear}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    วันที่ยื่นคำร้อง
                  </label>
                  <p className="text-gray-900 dark:text-white mt-1">
                    {new Date(claim.createdAt).toLocaleString("th-TH")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rejection Reason */}
          {claim.status === "REJECTED" && claim.rejectionReason && (
            <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl border border-red-200 dark:border-red-800">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-3 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                เหตุผลที่ไม่อนุมัติ
              </h3>
              <p className="text-red-800 dark:text-red-400 bg-white/50 dark:bg-gray-900/50 p-4 rounded-xl">{claim.rejectionReason}</p>
            </div>
          )}

          {/* Documents */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              เอกสารแนบ
              <span className="ml-2 px-2.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm rounded-full">
                {claim.documents.length}
              </span>
            </h2>
            {claim.documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {claim.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-700 dark:to-gray-700/50 rounded-xl hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-200 group border border-gray-100 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-800"
                  >
                    <div className="flex">{getFileIcon(doc.fileType)}</div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {doc.documentName || doc.fileName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(doc.fileSize)}
                      </p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <File className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">ไม่มีเอกสารแนบ</p>
              </div>
            )}
          </div>

          {/* Comments - Read Only */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              หมายเหตุ
              <span className="ml-2 px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm rounded-full">
                {claim.comments.length}
              </span>
            </h2>

            {/* Comments List - Read Only */}
            <div className="space-y-4">
              {claim.comments.length > 0 ? (
                claim.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-xl ${
                      comment.userType === "USER"
                        ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-400"
                        : "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-400"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {comment.userType === "USER" ? (
                          <>
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-white" />
                            </div>
                            {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : "ผู้ใช้งาน"}
                          </>
                        ) : (
                          <>
                            <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                              <BadgeCheck className="w-3 h-3 text-white" />
                            </div>
                            ผู้ดูแลระบบ
                          </>
                        )}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(comment.createdAt).toLocaleString("th-TH")}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap pl-8">
                      {comment.comment}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">ไม่มีหมายเหตุ</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Buttons - Only show if not processed */}
          {!isProcessed() && (canApprove() || canReject()) && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                การดำเนินการ
              </h2>
              <div className="space-y-3">
                {canApprove() && (
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    อนุมัติ
                  </button>
                )}
                {canReject() && (
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <XCircle className="w-5 h-5" />
                    ปฏิเสธ
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Processed Status Info */}
          {isProcessed() && (
            <div className={`p-6 rounded-2xl shadow-sm border ${
              claim.status === "REJECTED" 
                ? "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800"
                : "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800"
            }`}>
              <div className="flex items-center gap-3">
                {claim.status === "REJECTED" ? (
                  <XCircle className="w-8 h-8 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                )}
                <div>
                  <p className={`font-semibold ${
                    claim.status === "REJECTED" ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"
                  }`}>
                    {claim.status === "REJECTED" ? "ปฏิเสธแล้ว" : "ดำเนินการเสร็จสิ้น"}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    คำร้องนี้ได้รับการดำเนินการแล้ว
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              ประวัติการดำเนินการ
            </h2>
            <div className="space-y-4">
              {/* Created */}
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  {(claim.approvals.length > 0 || claim.status !== "PENDING") && (
                    <div className="w-0.5 h-5 bg-gradient-to-b from-blue-300 to-gray-300 dark:from-blue-600 dark:to-gray-600 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-semibold text-gray-900 dark:text-white">ยื่นคำร้อง</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(claim.createdAt).toLocaleString("th-TH")}
                  </p>
                </div>
              </div>

              {/* Approvals */}
              {claim.approvals.map((approval, index) => (
                <div key={approval.id} className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                        approval.status === "REJECTED"
                          ? "bg-gradient-to-br from-red-500 to-rose-600"
                          : "bg-gradient-to-br from-emerald-500 to-green-600"
                      }`}
                    >
                      {approval.status === "REJECTED" ? (
                        <XCircle className="w-5 h-5 text-white" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      )}
                    </div>
                    {index < claim.approvals.length - 1 && (
                      <div className={`w-0.5 h-5 mt-2 ${
                        approval.status === "REJECTED" 
                          ? "bg-gradient-to-b from-red-300 to-gray-300 dark:from-red-600 dark:to-gray-600"
                          : "bg-gradient-to-b from-emerald-300 to-gray-300 dark:from-emerald-600 dark:to-gray-600"
                      }`}></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {approval.status === "REJECTED" ? "ปฏิเสธ" : "อนุมัติ"} โดย {approval.approver.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(approval.approvedAt).toLocaleString("th-TH")}
                    </p>
                    {approval.comments && (
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        {approval.comments}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Approver Info */}
          {(claim.adminApprover || claim.managerApprover) && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-green-500" />
                ผู้อนุมัติ
              </h2>
              <div className="space-y-4">
                {claim.adminApprover && (
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Admin (ขั้นที่ 1)</p>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {claim.adminApprover.name}
                    </p>
                    {claim.adminApprovedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(claim.adminApprovedAt).toLocaleString("th-TH")}
                      </p>
                    )}
                  </div>
                )}
                {claim.managerApprover && (
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Manager (ขั้นที่ 2)</p>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {claim.managerApprover.name}
                    </p>
                    {claim.completedDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(claim.completedDate).toLocaleString("th-TH")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  ยืนยันการอนุมัติ
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {session?.user?.role === "MANAGER" ? "กรุณาระบุจำนวนเงินที่อนุมัติ" : "คุณต้องการอนุมัติคำร้องนี้ใช่หรือไม่?"}
                </p>
              </div>
            </div>

            {session?.user?.role === "MANAGER" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  จำนวนเงินที่ขอ: <span className="text-blue-600 dark:text-blue-400 font-semibold">{claim?.requestedAmount?.toLocaleString()} บาท</span>
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    placeholder="จำนวนเงินที่อนุมัติ"
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                หมายเหตุ (ถ้ามี)
              </label>
              <textarea
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                placeholder="หมายเหตุการอนุมัติ..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmApprove}
                disabled={processing || (session?.user?.role === "MANAGER" && (!approvedAmount || parseFloat(approvedAmount) <= 0))}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    ยืนยันอนุมัติ
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setApprovedAmount("");
                  setApproveComment("");
                }}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                <X className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  ปฏิเสธคำร้อง
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  กรุณาระบุเหตุผลในการปฏิเสธคำร้องนี้
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                เหตุผลในการปฏิเสธ <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                placeholder="เหตุผลในการปฏิเสธ..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังดำเนินการ...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    ยืนยันปฏิเสธ
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                disabled={processing}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
