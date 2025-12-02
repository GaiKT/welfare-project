"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { PageLoading } from "@/components/ui/loading";

interface ClaimDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

interface ClaimApproval {
  id: string;
  status: string;
  comments: string | null;
  approvedAt: string;
  approver: {
    name: string;
    username: string;
    role: string;
  };
}

interface ClaimComment {
  id: string;
  comment: string;
  userType: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
  admin?: {
    name: string;
  };
}

interface ClaimDetail {
  id: string;
  welfare: {
    id: string;
    name: string;
    description: string | null;
  };
  user: {
    identity: string;
    firstName: string;
    lastName: string;
    title: string | null;
    email: string | null;
    phone: string | null;
  };
  amount: number;
  status: string;
  description: string;
  fiscalYear: number;
  createdAt: string;
  documents: ClaimDocument[];
  approvals: ClaimApproval[];
  comments: ClaimComment[];
  adminApprover: {
    name: string;
    username: string;
  } | null;
  managerApprover: {
    name: string;
    username: string;
  } | null;
  adminApprovedAt: string | null;
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
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (session?.user && !session.user.role) {
      // User doesn't have AdminRole, redirect
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role && claimId) {
      // Only admins/managers have role property
      fetchClaimDetail();
    }
  }, [session, claimId]);

  const fetchClaimDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/claims/${claimId}`);
      if (response.ok) {
        const data = await response.json();
        setClaim(data.claim);
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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await fetch(`/api/claims/${claimId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: commentText }),
      });

      if (response.ok) {
        setCommentText("");
        fetchClaimDetail();
      } else {
        const data = await response.json();
        alert(data.error || "เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("เกิดข้อผิดพลาดในการเพิ่มความคิดเห็น");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm("คุณต้องการอนุมัติคำร้องนี้ใช่หรือไม่?")) return;

    try {
      setProcessing(true);
      const endpoint =
        session?.user?.role === "MANAGER"
          ? `/api/claims/${claimId}/manager-approve`
          : `/api/claims/${claimId}/admin-approve`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: commentText || undefined }),
      });

      if (response.ok) {
        alert("อนุมัติคำร้องสำเร็จ");
        setCommentText("");
        fetchClaimDetail();
      } else {
        const data = await response.json();
        alert(data.error || "เกิดข้อผิดพลาดในการอนุมัติ");
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
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (response.ok) {
        alert("ปฏิเสธคำร้องสำเร็จ");
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
    const statusConfig: Record<string, { text: string; className: string }> = {
      PENDING: {
        text: "รอตรวจสอบ",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
      IN_REVIEW: {
        text: "กำลังตรวจสอบ",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      ADMIN_APPROVED: {
        text: "ผ่านการอนุมัติขั้นที่ 1",
        className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      },
      MANAGER_APPROVED: {
        text: "อนุมัติแล้ว",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      REJECTED: {
        text: "ไม่อนุมัติ",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
      COMPLETED: {
        text: "เสร็จสิ้น",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
    };

    const config = statusConfig[status] || {
      text: status,
      className: "bg-gray-100 text-gray-800",
    };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${config.className}`}>
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
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
        </svg>
      );
    }
    if (fileType.includes("word") || fileType.includes("document")) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
        </svg>
      );
    }
    if (fileType.includes("sheet") || fileType.includes("excel")) {
      return (
        <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
        </svg>
      );
    }
    if (fileType.includes("image")) {
      return (
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
      </svg>
    );
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

  if (status === "loading" || loading) {
    return <PageLoading text="กำลังโหลด..." fullScreen />;
  }

  if (error || !claim) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error || "ไม่พบข้อมูลคำร้อง"}</p>
          <Link
            href="claims-admin"
            className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
          >
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
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← กลับ
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              รายละเอียดคำร้อง
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              รหัสคำร้อง: {claim.id.substring(0, 8)}
            </p>
          </div>
          {getStatusBadge(claim.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Info */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ข้อมูลผู้ยื่นคำร้อง
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  ชื่อ-นามสกุล
                </label>
                <p className="text-lg text-gray-900 dark:text-white">
                  {claim.user.firstName} {claim.user.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  รหัสพนักงาน
                </label>
                <p className="text-lg text-gray-900 dark:text-white">{claim.user.identity}</p>
              </div>
              {claim.user.title && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    ตำแหน่ง
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white">{claim.user.title}</p>
                </div>
              )}
              {claim.user.email && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    อีเมล
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white">{claim.user.email}</p>
                </div>
              )}
              {claim.user.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    เบอร์โทร
                  </label>
                  <p className="text-lg text-gray-900 dark:text-white">{claim.user.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Claim Info */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ข้อมูลคำร้อง
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  สวัสดิการ
                </label>
                <p className="text-lg text-gray-900 dark:text-white">{claim.welfare.name}</p>
                {claim.welfare.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {claim.welfare.description}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  จำนวนเงิน
                </label>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {claim.amount.toLocaleString()} บาท
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  รายละเอียด
                </label>
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {claim.description}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    ปีงบประมาณ
                  </label>
                  <p className="text-gray-900 dark:text-white">{claim.fiscalYear}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    วันที่ยื่นคำร้อง
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(claim.createdAt).toLocaleString("th-TH")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rejection Reason */}
          {claim.status === "REJECTED" && claim.rejectionReason && (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
                เหตุผลที่ไม่อนุมัติ
              </h3>
              <p className="text-red-800 dark:text-red-400">{claim.rejectionReason}</p>
            </div>
          )}

          {/* Documents */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              เอกสารแนบ ({claim.documents.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {claim.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex-shrink-0">{getFileIcon(doc.fileType)}</div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {doc.fileName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(doc.fileSize)}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ความคิดเห็น ({claim.comments.length})
            </h2>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="mb-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="เพิ่มความคิดเห็น..."
                disabled={submittingComment}
              />
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {submittingComment ? "กำลังส่ง..." : "ส่งความคิดเห็น"}
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {claim.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-4 rounded-lg ${
                    comment.userType === "USER"
                      ? "bg-blue-50 dark:bg-blue-900/20 ml-0 mr-12"
                      : "bg-gray-50 dark:bg-gray-700 ml-12 mr-0"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {comment.userType === "USER"
                        ? `${comment.user?.firstName || ""} ${comment.user?.lastName || ""}`.trim()
                        : comment.admin?.name || "ผู้ดูแลระบบ"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleString("th-TH")}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.comment}
                  </p>
                </div>
              ))}
              {claim.comments.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  ยังไม่มีความคิดเห็น
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Buttons */}
          {(canApprove() || canReject()) && (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                การดำเนินการ
              </h2>
              <div className="space-y-3">
                {canApprove() && (
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {processing ? "กำลังดำเนินการ..." : "อนุมัติ"}
                  </button>
                )}
                {canReject() && (
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    ปฏิเสธ
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ประวัติการดำเนินการ
            </h2>
            <div className="space-y-4">
              {/* Created */}
              <div className="flex">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  {(claim.approvals.length > 0 || claim.status !== "PENDING") && (
                    <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-600 mt-2"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-gray-900 dark:text-white">ยื่นคำร้อง</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(claim.createdAt).toLocaleString("th-TH")}
                  </p>
                </div>
              </div>

              {/* Approvals */}
              {claim.approvals.map((approval, index) => (
                <div key={approval.id} className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        approval.status === "REJECTED" ? "bg-red-500" : "bg-green-500"
                      }`}
                    >
                      {approval.status === "REJECTED" ? (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    {index < claim.approvals.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-600 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {approval.status === "REJECTED" ? "ปฏิเสธ" : "อนุมัติ"} โดย{" "}
                      {approval.approver.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(approval.approvedAt).toLocaleString("th-TH")}
                    </p>
                    {approval.comments && (
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
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
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                ผู้อนุมัติ
              </h2>
              <div className="space-y-3">
                {claim.adminApprover && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Admin</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {claim.adminApprover.name}
                    </p>
                    {claim.adminApprovedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(claim.adminApprovedAt).toLocaleString("th-TH")}
                      </p>
                    )}
                  </div>
                )}
                {claim.managerApprover && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manager</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {claim.managerApprover.name}
                    </p>
                    {claim.completedDate && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              ปฏิเสธคำร้อง
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              กรุณาระบุเหตุผลในการปฏิเสธคำร้องนี้
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              placeholder="เหตุผลในการปฏิเสธ..."
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {processing ? "กำลังดำเนินการ..." : "ยืนยันปฏิเสธ"}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
