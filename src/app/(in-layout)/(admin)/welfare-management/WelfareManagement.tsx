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
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { PageLoading } from "@/components/ui/loading";

interface Welfare {
  id: string;
  name: string;
  description: string | null;
  budget: number;
  maxUsed: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    claims: number;
  };
}

interface WelfareFormData {
  name: string;
  description: string;
  budget: number | string;
  maxUsed: number | string;
  duration: number | string;
}

const initialFormData: WelfareFormData = {
  name: "",
  description: "",
  budget: "",
  maxUsed: "",
  duration: "",
};

const inputClassName = "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function WelfareManagement() {
  const [welfares, setWelfares] = useState<Welfare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedWelfare, setSelectedWelfare] = useState<Welfare | null>(null);
  const [formData, setFormData] = useState<WelfareFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  const fetchWelfares = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/welfare-management");
      const result = await response.json();

      if (response.ok) {
        setWelfares(result.welfarePrograms);
      } else {
        setError(result.error || "Failed to fetch welfare programs");
      }
    } catch (err) {
      setError("Failed to fetch welfare programs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWelfares();
  }, [fetchWelfares]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleCreateWelfare = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/welfare-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budget: Number(formData.budget),
          maxUsed: Number(formData.maxUsed),
          duration: Number(formData.duration),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsCreateModalOpen(false);
        setFormData(initialFormData);
        fetchWelfares();
      } else {
        alert(result.error || "Failed to create welfare program");
      }
    } catch (err) {
      alert("Failed to create welfare program");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditWelfare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWelfare) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/welfare-management/${selectedWelfare.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          budget: Number(formData.budget),
          maxUsed: Number(formData.maxUsed),
          duration: Number(formData.duration),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsEditModalOpen(false);
        setSelectedWelfare(null);
        setFormData(initialFormData);
        fetchWelfares();
      } else {
        alert(result.error || "Failed to update welfare program");
      }
    } catch (err) {
      alert("Failed to update welfare program");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWelfare = async () => {
    if (!selectedWelfare) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/welfare-management/${selectedWelfare.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        setIsDeleteModalOpen(false);
        setSelectedWelfare(null);
        fetchWelfares();
      } else {
        alert(result.error || "Failed to delete welfare program");
      }
    } catch (err) {
      alert("Failed to delete welfare program");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (welfare: Welfare) => {
    setSelectedWelfare(welfare);
    setFormData({
      name: welfare.name,
      description: welfare.description || "",
      budget: welfare.budget,
      maxUsed: welfare.maxUsed,
      duration: welfare.duration,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (welfare: Welfare) => {
    setSelectedWelfare(welfare);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (welfare: Welfare) => {
    setSelectedWelfare(welfare);
    setIsViewModalOpen(true);
  };

  const filteredWelfares = welfares.filter(
    (welfare) =>
      welfare.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (welfare.description && welfare.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
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
            จัดการสวัสดิการ
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            จัดการโปรแกรมสวัสดิการในระบบ
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData(initialFormData);
            setIsCreateModalOpen(true);
          }}
        >
          + เพิ่มสวัสดิการ
        </Button>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <input
          type="text"
          placeholder="ค้นหาสวัสดิการ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={inputClassName}
        />
      </div>

      {/* Welfare Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  ชื่อสวัสดิการ
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  งบประมาณ
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  เบิกได้สูงสุด/คน
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  ระยะเวลา (วัน)
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  จำนวนการเบิก
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  วันที่สร้าง
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                  จัดการ
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredWelfares.length > 0 ? (
                filteredWelfares.map((welfare) => (
                  <TableRow key={welfare.id}>
                    <TableCell className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {welfare.name}
                        </p>
                        {welfare.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {welfare.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                      {formatCurrency(welfare.budget)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                      {formatCurrency(welfare.maxUsed)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                      {welfare.duration} วัน
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge color={welfare._count?.claims ? "info" : "light"} size="sm">
                        {welfare._count?.claims || 0} รายการ
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(welfare.createdAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openViewModal(welfare)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="ดูรายละเอียด"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openEditModal(welfare)}
                          className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          title="แก้ไข"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDeleteModal(welfare)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={(welfare._count?.claims || 0) > 0}
                          title={(welfare._count?.claims || 0) > 0 ? "ไม่สามารถลบได้ (มีการเบิกอยู่)" : "ลบ"}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="px-4 py-8 text-center text-gray-500">
                    ไม่พบข้อมูลสวัสดิการ
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="max-w-lg p-6"
      >
        <h2 className="mb-6 text-xl font-bold text-gray-800 dark:text-white">
          เพิ่มสวัสดิการใหม่
        </h2>
        <form onSubmit={handleCreateWelfare} className="space-y-4">
          <div>
            <Label>ชื่อสวัสดิการ *</Label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className={inputClassName}
            />
          </div>
          <div>
            <Label>รายละเอียด</Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`${inputClassName} h-auto`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>งบประมาณ (บาท) *</Label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className={inputClassName}
              />
            </div>
            <div>
              <Label>เบิกได้สูงสุด/คน (บาท) *</Label>
              <input
                type="number"
                name="maxUsed"
                value={formData.maxUsed}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className={inputClassName}
              />
            </div>
          </div>
          <div>
            <Label>ระยะเวลา (วัน) *</Label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              required
              min="1"
              className={inputClassName}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              ยกเลิก
            </Button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center font-medium gap-2 rounded-lg px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed"
            >
              {submitting ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        className="max-w-lg p-6"
      >
        <h2 className="mb-6 text-xl font-bold text-gray-800 dark:text-white">
          แก้ไขสวัสดิการ
        </h2>
        <form onSubmit={handleEditWelfare} className="space-y-4">
          <div>
            <Label>ชื่อสวัสดิการ *</Label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className={inputClassName}
            />
          </div>
          <div>
            <Label>รายละเอียด</Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`${inputClassName} h-auto`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>งบประมาณ (บาท) *</Label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className={inputClassName}
              />
            </div>
            <div>
              <Label>เบิกได้สูงสุด/คน (บาท) *</Label>
              <input
                type="number"
                name="maxUsed"
                value={formData.maxUsed}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className={inputClassName}
              />
            </div>
          </div>
          <div>
            <Label>ระยะเวลา (วัน) *</Label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              required
              min="1"
              className={inputClassName}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              ยกเลิก
            </Button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center font-medium gap-2 rounded-lg px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed"
            >
              {submitting ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        className="max-w-lg p-6"
      >
        <h2 className="mb-6 text-xl font-bold text-gray-800 dark:text-white">
          รายละเอียดสวัสดิการ
        </h2>
        {selectedWelfare && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ชื่อสวัสดิการ</p>
                <p className="font-medium text-gray-800 dark:text-white">{selectedWelfare.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">จำนวนการเบิก</p>
                <p className="font-medium text-gray-800 dark:text-white">{selectedWelfare._count?.claims || 0} รายการ</p>
              </div>
            </div>
            {selectedWelfare.description && (
              <div>
                <p className="text-sm text-gray-500">รายละเอียด</p>
                <p className="font-medium text-gray-800 dark:text-white">{selectedWelfare.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">งบประมาณ</p>
                <p className="font-medium text-gray-800 dark:text-white">{formatCurrency(selectedWelfare.budget)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">เบิกได้สูงสุด/คน</p>
                <p className="font-medium text-gray-800 dark:text-white">{formatCurrency(selectedWelfare.maxUsed)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">ระยะเวลา</p>
                <p className="font-medium text-gray-800 dark:text-white">{selectedWelfare.duration} วัน</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">วันที่สร้าง</p>
                <p className="font-medium text-gray-800 dark:text-white">{formatDate(selectedWelfare.createdAt)}</p>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsViewModalOpen(false)}
              >
                ปิด
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="max-w-md p-6"
      >
        <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
          ยืนยันการลบ
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-400">
          คุณต้องการลบสวัสดิการ{" "}
          <span className="font-semibold">{selectedWelfare?.name}</span>{" "}
          ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            ยกเลิก
          </Button>
          <Button
            variant="primary"
            onClick={handleDeleteWelfare}
            disabled={submitting}
            className="bg-red-500 hover:bg-red-600"
          >
            {submitting ? "กำลังลบ..." : "ลบ"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
