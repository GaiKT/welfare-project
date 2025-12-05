"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { PageLoading } from "@/components/ui/loading";

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white";

interface Admin {
  id: string;
  username: string;
  name: string | null;
  role: "PRIMARY" | "ADMIN" | "MANAGER";
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  adminId: string;
  admin: Admin;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  actions: string[];
  entities: string[];
}

const actionLabels: Record<string, string> = {
  CREATE: "สร้าง",
  UPDATE: "แก้ไข",
  DELETE: "ลบ",
  APPROVE: "อนุมัติ",
  REJECT: "ปฏิเสธ",
  LOGIN: "เข้าสู่ระบบ",
  LOGOUT: "ออกจากระบบ",
};

const actionColors: Record<string, "success" | "warning" | "error" | "info" | "light"> = {
  CREATE: "success",
  UPDATE: "warning",
  DELETE: "error",
  APPROVE: "success",
  REJECT: "error",
  LOGIN: "info",
  LOGOUT: "light",
};

const entityLabels: Record<string, string> = {
  USER: "ผู้ใช้",
  ADMIN: "ผู้ดูแลระบบ",
  WELFARE: "สวัสดิการ",
  CLAIM: "คำขอเบิก",
  QUOTA: "โควต้า",
};

const roleLabels: Record<string, string> = {
  PRIMARY: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
};

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [selectedEntity, setSelectedEntity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Filters>({
    actions: [],
    entities: [],
  });

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) params.append("search", searchTerm);
      if (selectedAction) params.append("action", selectedAction);
      if (selectedEntity) params.append("entity", selectedEntity);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/audit-log?${params.toString()}`);
      const result = await response.json();

      if (response.ok) {
        setAuditLogs(result.auditLogs);
        setPagination(result.pagination);
        setFilters(result.filters);
      } else {
        setError(result.error || "Failed to fetch audit logs");
      }
    } catch (err) {
      setError("Failed to fetch audit logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, selectedAction, selectedEntity, startDate, endDate]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionLabel = (action: string) => {
    return actionLabels[action.toUpperCase()] || action;
  };

  const getActionColor = (action: string): "success" | "warning" | "error" | "info" | "light" => {
    return actionColors[action.toUpperCase()] || "light";
  };

  const getEntityLabel = (entity: string) => {
    return entityLabels[entity.toUpperCase()] || entity;
  };

  if (loading && auditLogs.length === 0) {
    return <PageLoading text="กำลังโหลดข้อมูล..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-error-500 mb-2">เกิดข้อผิดพลาด</p>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            ประวัติการดำเนินการ
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            ติดตามการดำเนินการทั้งหมดในระบบ
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              ค้นหา
            </label>
            <input
              type="text"
              placeholder="ค้นหา..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                e.key === "Enter" && handleSearch()
              }
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              การดำเนินการ
            </label>
            <select
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">ทั้งหมด</option>
              {filters.actions.map((action) => (
                <option key={action} value={action}>
                  {getActionLabel(action)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              ประเภทข้อมูล
            </label>
            <select
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
            >
              <option value="">ทั้งหมด</option>
              {filters.entities.map((entity) => (
                <option key={entity} value={entity}>
                  {getEntityLabel(entity)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                >
                  วันที่/เวลา
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                >
                  การดำเนินการ
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                >
                  ประเภทข้อมูล
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                >
                  รหัสข้อมูล
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                >
                  ผู้ดำเนินการ
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500"
                >
                  บทบาท
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-gray-500"
                    colSpan={6}
                  >
                    ไม่พบข้อมูลประวัติการดำเนินการ
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(log.timestamp)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge color={getActionColor(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {getEntityLabel(log.entity)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">
                      {log.entityId.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {log.admin.name || log.admin.username}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {roleLabels[log.admin.role] || log.admin.role}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800">
            <div className="text-sm text-gray-500">
              แสดง {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} จาก{" "}
              {pagination.total} รายการ
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                ก่อนหน้า
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                        pagination.page === pageNum
                          ? "bg-brand-500 text-white"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          รวมทั้งหมด {pagination.total} รายการ
        </p>
      </div>
    </div>
  );
}
