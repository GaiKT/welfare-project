"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface RecentClaim {
  id: string;
  userName: string;
  welfareTypeName: string;
  subTypeName: string;
  requestedAmount: number;
  approvedAmount: number | null;
  status: string;
  submittedDate: string;
}

interface RecentClaimsProps {
  data: RecentClaim[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
    case "MANAGER_APPROVED":
      return "success";
    case "PENDING":
    case "IN_REVIEW":
      return "warning";
    case "ADMIN_APPROVED":
      return "info";
    case "REJECTED":
      return "error";
    default:
      return "light";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "PENDING":
      return "รอดำเนินการ";
    case "IN_REVIEW":
      return "กำลังตรวจสอบ";
    case "ADMIN_APPROVED":
      return "Admin อนุมัติแล้ว";
    case "MANAGER_APPROVED":
      return "อนุมัติแล้ว";
    case "COMPLETED":
      return "เสร็จสิ้น";
    case "REJECTED":
      return "ปฏิเสธ";
    default:
      return status;
  }
};

export default function RecentClaims({ data }: RecentClaimsProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            คำขอเบิกล่าสุด
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/claims-management"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            ดูทั้งหมด
          </a>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                ผู้ยื่นคำขอ
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                ประเภทสวัสดิการ
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                จำนวนเงิน
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                วันที่ยื่น
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                สถานะ
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.length > 0 ? (
              data.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="py-3">
                    <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {claim.userName}
                    </p>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-gray-800 text-theme-sm dark:text-white/90">
                      {claim.welfareTypeName}
                    </p>
                    <p className="text-gray-500 text-theme-xs dark:text-gray-400">
                      {claim.subTypeName}
                    </p>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {formatCurrency(claim.requestedAmount)}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {formatDate(claim.submittedDate)}
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    <Badge
                      size="sm"
                      color={getStatusColor(claim.status)}
                    >
                      {getStatusLabel(claim.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="py-8 text-center text-gray-500 dark:text-gray-400">
                  ไม่มีคำขอเบิกสวัสดิการ
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
