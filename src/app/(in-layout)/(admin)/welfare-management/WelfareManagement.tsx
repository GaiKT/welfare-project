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
import Input from "@/components/form/input/InputField";
import { PageLoading } from "@/components/ui/loading";
import { toast } from "react-toastify";

// Types
interface RequiredDocument {
  id?: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  sortOrder: number;
}

interface WelfareSubType {
  id?: string;
  code: string;
  name: string;
  description: string | null;
  amount: number;
  unitType: "LUMP_SUM" | "PER_NIGHT" | "PER_INCIDENT";
  maxPerRequest: number | null;
  maxPerYear: number | null;
  maxLifetime: number | null;
  maxClaimsPerYear: number | null;
  maxClaimsLifetime: number | null;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    claims: number;
  };
}

interface WelfareType {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  subTypes: WelfareSubType[];
  requiredDocuments: RequiredDocument[];
  _count?: {
    subTypes: number;
    requiredDocuments: number;
  };
}

// Form data types
interface WelfareFormData {
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  subTypes: WelfareSubType[];
  requiredDocuments: RequiredDocument[];
}

const initialSubType: WelfareSubType = {
  code: "",
  name: "",
  description: null,
  amount: 0,
  unitType: "LUMP_SUM",
  maxPerRequest: null,
  maxPerYear: null,
  maxLifetime: null,
  maxClaimsPerYear: null,
  maxClaimsLifetime: null,
  isActive: true,
  sortOrder: 0,
};

const initialDocument: RequiredDocument = {
  name: "",
  description: null,
  isRequired: true,
  sortOrder: 0,
};

const initialFormData: WelfareFormData = {
  code: "",
  name: "",
  description: "",
  isActive: true,
  sortOrder: 0,
  subTypes: [],
  requiredDocuments: [],
};

const unitTypeLabels: Record<string, string> = {
  LUMP_SUM: "เหมาจ่าย",
  PER_NIGHT: "ต่อคืน",
  PER_INCIDENT: "ต่อครั้ง",
};

const unitTypeOptions = [
  { value: "LUMP_SUM", label: "เหมาจ่าย" },
  { value: "PER_NIGHT", label: "ต่อคืน" },
  { value: "PER_INCIDENT", label: "ต่อครั้ง" },
];

export default function WelfareManagement() {
  const [welfareTypes, setWelfareTypes] = useState<WelfareType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedWelfareType, setSelectedWelfareType] = useState<WelfareType | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<WelfareFormData>(initialFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchWelfareTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/welfare-management");
      const result = await response.json();

      if (response.ok && result.success) {
        setWelfareTypes(result.data?.welfareTypes || []);
      } else {
        setError(result.error || "Failed to fetch welfare types");
      }
    } catch (err) {
      setError("Failed to fetch welfare types");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWelfareTypes();
  }, [fetchWelfareTypes]);

  const toggleExpand = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
    }
    setExpandedTypes(newExpanded);
  };

  const openViewModal = (welfareType: WelfareType) => {
    setSelectedWelfareType(welfareType);
    setIsViewModalOpen(true);
  };

  // Create handlers
  const openCreateModal = () => {
    setFormData(initialFormData);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.code || !formData.name) {
      setFormError("กรุณากรอกรหัสและชื่อสวัสดิการ");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const response = await fetch("/api/welfare-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setIsCreateModalOpen(false);
        toast.success("สร้างสวัสดิการสำเร็จ!");
        fetchWelfareTypes();
      } else {
        setFormError(result.error || "ไม่สามารถสร้างสวัสดิการได้");
        toast.error(result.error || "ไม่สามารถสร้างสวัสดิการได้");
      }
    } catch (err) {
      setFormError("เกิดข้อผิดพลาดในการสร้างสวัสดิการ");
      toast.error("เกิดข้อผิดพลาดในการสร้างสวัสดิการ");
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  // Edit handlers
  const openEditModal = (welfareType: WelfareType) => {
    setSelectedWelfareType(welfareType);
    setFormData({
      code: welfareType.code,
      name: welfareType.name,
      description: welfareType.description || "",
      isActive: welfareType.isActive,
      sortOrder: welfareType.sortOrder,
      subTypes: welfareType.subTypes.map(st => ({
        ...st,
        description: st.description || null,
      })),
      requiredDocuments: welfareType.requiredDocuments.map(doc => ({
        ...doc,
        description: doc.description || null,
      })),
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedWelfareType || !formData.name) {
      setFormError("กรุณากรอกชื่อสวัสดิการ");
      return;
    }

    setFormLoading(true);
    setFormError(null);

    try {
      const response = await fetch(`/api/welfare-management/${selectedWelfareType.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setIsEditModalOpen(false);
        toast.success("อัพเดทสวัสดิการสำเร็จ!");
        fetchWelfareTypes();
      } else {
        setFormError(result.error || "ไม่สามารถอัพเดทสวัสดิการได้");
        toast.error(result.error || "ไม่สามารถอัพเดทสวัสดิการได้");
      }
    } catch (err) {
      setFormError("เกิดข้อผิดพลาดในการอัพเดทสวัสดิการ");
      toast.error("เกิดข้อผิดพลาดในการอัพเดทสวัสดิการ");
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  // Delete handlers
  const openDeleteModal = (welfareType: WelfareType) => {
    setSelectedWelfareType(welfareType);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedWelfareType) return;

    setFormLoading(true);
    setFormError(null);

    try {
      const response = await fetch(`/api/welfare-management/${selectedWelfareType.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setIsDeleteModalOpen(false);
        toast.success(result.softDeleted ? "ปิดใช้งานสวัสดิการสำเร็จ!" : "ลบสวัสดิการสำเร็จ!");
        fetchWelfareTypes();
      } else {
        setFormError(result.error || "ไม่สามารถลบสวัสดิการได้");
        toast.error(result.error || "ไม่สามารถลบสวัสดิการได้");
      }
    } catch (err) {
      setFormError("เกิดข้อผิดพลาดในการลบสวัสดิการ");
      toast.error("เกิดข้อผิดพลาดในการลบสวัสดิการ");
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  // Sub-type handlers
  const addSubType = () => {
    setFormData({
      ...formData,
      subTypes: [...formData.subTypes, { ...initialSubType, sortOrder: formData.subTypes.length + 1 }],
    });
  };

  const updateSubType = (index: number, field: string, value: unknown) => {
    const newSubTypes = [...formData.subTypes];
    newSubTypes[index] = { ...newSubTypes[index], [field]: value };
    setFormData({ ...formData, subTypes: newSubTypes });
  };

  const removeSubType = (index: number) => {
    const newSubTypes = formData.subTypes.filter((_, i) => i !== index);
    setFormData({ ...formData, subTypes: newSubTypes });
  };

  // Document handlers
  const addDocument = () => {
    setFormData({
      ...formData,
      requiredDocuments: [...formData.requiredDocuments, { ...initialDocument, sortOrder: formData.requiredDocuments.length + 1 }],
    });
  };

  const updateDocument = (index: number, field: string, value: unknown) => {
    const newDocs = [...formData.requiredDocuments];
    newDocs[index] = { ...newDocs[index], [field]: value };
    setFormData({ ...formData, requiredDocuments: newDocs });
  };

  const removeDocument = (index: number) => {
    const newDocs = formData.requiredDocuments.filter((_, i) => i !== index);
    setFormData({ ...formData, requiredDocuments: newDocs });
  };

  const filteredWelfareTypes = welfareTypes.filter(
    (wt) =>
      wt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wt.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wt.description && wt.description.toLowerCase().includes(searchTerm.toLowerCase()))
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

  const getTotalClaims = (welfareType: WelfareType) => {
    return welfareType.subTypes.reduce((sum, st) => sum + (st._count?.claims || 0), 0);
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
          <Button onClick={fetchWelfareTypes} className="mt-4">
            ลองใหม่
          </Button>
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
            ดูและจัดการประเภทสวัสดิการทั้งหมดในระบบ
          </p>
        </div>
        <Button onClick={openCreateModal}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มสวัสดิการ
        </Button>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <input
          type="text"
          placeholder="ค้นหาสวัสดิการ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">ประเภทสวัสดิการ</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{welfareTypes.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">ประเภทย่อยทั้งหมด</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {welfareTypes.reduce((sum, wt) => sum + wt.subTypes.length, 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500 dark:text-gray-400">เอกสารที่ต้องแนบ</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            {welfareTypes.reduce((sum, wt) => sum + wt.requiredDocuments.length, 0)}
          </p>
        </div>
      </div>

      {/* Welfare Types List */}
      <div className="space-y-4">
        {filteredWelfareTypes.length > 0 ? (
          filteredWelfareTypes.map((welfareType) => (
            <div
              key={welfareType.id}
              className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden"
            >
              {/* Header Row */}
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white">
                        {welfareType.name}
                      </h3>
                      <Badge color={welfareType.isActive ? "success" : "error"} size="sm">
                        {welfareType.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      รหัส: {welfareType.code} • {welfareType.subTypes.length} ประเภทย่อย • {welfareType.requiredDocuments.length} เอกสาร
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">การเบิกทั้งหมด</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{getTotalClaims(welfareType)} รายการ</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openViewModal(welfareType);
                    }}
                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="ดูรายละเอียด"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(welfareType);
                    }}
                    className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title="แก้ไข"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(welfareType);
                    }}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="ลบ"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedTypes.has(welfareType.id) && (
                <div className="border-t border-gray-200 dark:border-gray-800">
                  {/* Sub-types Table */}
                  <div className="p-4">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-3">ประเภทย่อย</h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                          <TableRow>
                            <TableCell isHeader className="px-3 py-2 text-xs font-medium text-gray-500">ชื่อ</TableCell>
                            <TableCell isHeader className="px-3 py-2 text-xs font-medium text-gray-500">จำนวนเงิน</TableCell>
                            <TableCell isHeader className="px-3 py-2 text-xs font-medium text-gray-500">วิธีคำนวณ</TableCell>
                            <TableCell isHeader className="px-3 py-2 text-xs font-medium text-gray-500">เงื่อนไข</TableCell>
                            <TableCell isHeader className="px-3 py-2 text-xs font-medium text-gray-500">สถานะ</TableCell>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {welfareType.subTypes.map((subType) => (
                            <TableRow key={subType.id}>
                              <TableCell className="px-3 py-2">
                                <div>
                                  <p className="text-sm font-medium text-gray-800 dark:text-white">{subType.name}</p>
                                  <p className="text-xs text-gray-500">{subType.code}</p>
                                </div>
                              </TableCell>
                              <TableCell className="px-3 py-2 text-sm text-gray-800 dark:text-white">
                                {formatCurrency(subType.amount)}
                                {subType.unitType === "PER_NIGHT" && "/คืน"}
                                {subType.unitType === "PER_INCIDENT" && "/ครั้ง"}
                              </TableCell>
                              <TableCell className="px-3 py-2">
                                <Badge color="info" size="sm">{unitTypeLabels[subType.unitType]}</Badge>
                              </TableCell>
                              <TableCell className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                                <div className="space-y-1">
                                  {subType.maxPerRequest && <p>สูงสุด/ครั้ง: {formatCurrency(subType.maxPerRequest)}</p>}
                                  {subType.maxPerYear && <p>สูงสุด/ปี: {formatCurrency(subType.maxPerYear)}</p>}
                                  {subType.maxLifetime && <p>สูงสุดตลอด: {formatCurrency(subType.maxLifetime)}</p>}
                                  {subType.maxClaimsLifetime && <p>เบิกได้ {subType.maxClaimsLifetime} ครั้ง</p>}
                                  {!subType.maxPerRequest && !subType.maxPerYear && !subType.maxLifetime && !subType.maxClaimsLifetime && <p>ไม่มีเงื่อนไขพิเศษ</p>}
                                </div>
                              </TableCell>
                              <TableCell className="px-3 py-2">
                                <Badge color={subType.isActive ? "success" : "error"} size="sm">
                                  {subType.isActive ? "เปิด" : "ปิด"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Required Documents */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <h4 className="font-medium text-gray-800 dark:text-white mb-3">เอกสารที่ต้องแนบ</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {welfareType.requiredDocuments.map((doc, index) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                        >
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{doc.name}</span>
                          {doc.isRequired && (
                            <span className="text-red-500 text-xs">*</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-gray-500 dark:text-gray-400">ไม่พบข้อมูลสวัสดิการ</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        className="max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="mb-6 text-xl font-bold text-gray-800 dark:text-white">
          รายละเอียดสวัสดิการ
        </h2>
        {selectedWelfareType && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">ชื่อสวัสดิการ</Label>
                <p className="font-medium text-gray-800 dark:text-white">{selectedWelfareType.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">รหัส</Label>
                <p className="font-medium text-gray-800 dark:text-white">{selectedWelfareType.code}</p>
              </div>
            </div>
            
            {selectedWelfareType.description && (
              <div>
                <Label className="text-gray-500">รายละเอียด</Label>
                <p className="text-gray-800 dark:text-white">{selectedWelfareType.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500">สถานะ</Label>
                <Badge color={selectedWelfareType.isActive ? "success" : "error"}>
                  {selectedWelfareType.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                </Badge>
              </div>
              <div>
                <Label className="text-gray-500">วันที่สร้าง</Label>
                <p className="text-gray-800 dark:text-white">{formatDate(selectedWelfareType.createdAt)}</p>
              </div>
            </div>

            {/* Sub-types */}
            <div>
              <Label className="text-gray-500 mb-2 block">ประเภทย่อย ({selectedWelfareType.subTypes.length})</Label>
              <div className="space-y-2">
                {selectedWelfareType.subTypes.map((st) => (
                  <div key={st.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{st.name}</p>
                        <p className="text-sm text-gray-500">{st.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-brand-600 dark:text-brand-400">
                          {formatCurrency(st.amount)}
                          {st.unitType === "PER_NIGHT" && "/คืน"}
                          {st.unitType === "PER_INCIDENT" && "/ครั้ง"}
                        </p>
                        <Badge color="info" size="sm">{unitTypeLabels[st.unitType]}</Badge>
                      </div>
                    </div>
                    {(st.maxPerRequest || st.maxPerYear || st.maxLifetime || st.maxClaimsLifetime) && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                        {st.maxPerRequest && <span className="mr-3">สูงสุด/ครั้ง: {formatCurrency(st.maxPerRequest)}</span>}
                        {st.maxPerYear && <span className="mr-3">สูงสุด/ปี: {formatCurrency(st.maxPerYear)}</span>}
                        {st.maxLifetime && <span className="mr-3">สูงสุดตลอด: {formatCurrency(st.maxLifetime)}</span>}
                        {st.maxClaimsLifetime && <span>เบิกได้ {st.maxClaimsLifetime} ครั้ง</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Required Documents */}
            <div>
              <Label className="text-gray-500 mb-2 block">เอกสารที่ต้องแนบ ({selectedWelfareType.requiredDocuments.length})</Label>
              <div className="space-y-2">
                {selectedWelfareType.requiredDocuments.map((doc, index) => (
                  <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{doc.name}</span>
                    {doc.isRequired && (
                      <Badge color="error" size="sm">จำเป็น</Badge>
                    )}
                  </div>
                ))}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
        }}
        className="max-w-4xl p-6 max-h-[90vh] overflow-y-auto"
      >
        <h2 className="mb-6 text-xl font-bold text-gray-800 dark:text-white">
          {isCreateModalOpen ? "เพิ่มสวัสดิการใหม่" : "แก้ไขสวัสดิการ"}
        </h2>

        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {formError}
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>รหัสสวัสดิการ *</Label>
              <Input
                type="text"
                placeholder="เช่น FUNERAL, MEDICAL"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={isEditModalOpen}
              />
            </div>
            <div>
              <Label>ชื่อสวัสดิการ *</Label>
              <Input
                type="text"
                placeholder="เช่น สวัสดิการฌาปนกิจสงเคราะห์"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>รายละเอียด</Label>
            <textarea
              className="h-20 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder="คำอธิบายเพิ่มเติม"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ลำดับการแสดง</Label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <Label className="mb-0">เปิดใช้งาน</Label>
            </div>
          </div>

          {/* Sub-types */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold mb-0">ประเภทย่อย</Label>
              <Button size="sm" variant="outline" onClick={addSubType}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มประเภทย่อย
              </Button>
            </div>

            {formData.subTypes.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">ยังไม่มีประเภทย่อย</p>
            ) : (
              <div className="space-y-4">
                {formData.subTypes.map((subType, index) => (
                  <div key={index} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        ประเภทย่อย #{index + 1}
                      </span>
                      <button
                        onClick={() => removeSubType(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">รหัส *</Label>
                        <Input
                          type="text"
                          placeholder="เช่น MEMBER"
                          value={subType.code}
                          onChange={(e) => updateSubType(index, "code", e.target.value.toUpperCase())}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">ชื่อ *</Label>
                        <Input
                          type="text"
                          placeholder="เช่น กรณีสมาชิก"
                          value={subType.name}
                          onChange={(e) => updateSubType(index, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">จำนวนเงิน (บาท) *</Label>
                        <Input
                          type="number"
                          placeholder="10000"
                          value={subType.amount || ""}
                          onChange={(e) => updateSubType(index, "amount", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div>
                        <Label className="text-xs">วิธีคำนวณ</Label>
                        <select
                          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          value={subType.unitType}
                          onChange={(e) => updateSubType(index, "unitType", e.target.value)}
                        >
                          {unitTypeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">สูงสุด/ครั้ง</Label>
                        <Input
                          type="number"
                          placeholder="ไม่จำกัด"
                          value={subType.maxPerRequest || ""}
                          onChange={(e) => updateSubType(index, "maxPerRequest", e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">สูงสุด/ปี</Label>
                        <Input
                          type="number"
                          placeholder="ไม่จำกัด"
                          value={subType.maxPerYear || ""}
                          onChange={(e) => updateSubType(index, "maxPerYear", e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div>
                        <Label className="text-xs">สูงสุดตลอดชีพ</Label>
                        <Input
                          type="number"
                          placeholder="ไม่จำกัด"
                          value={subType.maxLifetime || ""}
                          onChange={(e) => updateSubType(index, "maxLifetime", e.target.value ? parseFloat(e.target.value) : null)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">จำนวนครั้งตลอดชีพ</Label>
                        <Input
                          type="number"
                          placeholder="ไม่จำกัด"
                          value={subType.maxClaimsLifetime || ""}
                          onChange={(e) => updateSubType(index, "maxClaimsLifetime", e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-5">
                        <input
                          type="checkbox"
                          checked={subType.isActive}
                          onChange={(e) => updateSubType(index, "isActive", e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <Label className="text-xs mb-0">เปิดใช้งาน</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Required Documents */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-semibold mb-0">เอกสารที่ต้องแนบ</Label>
              <Button size="sm" variant="outline" onClick={addDocument}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                เพิ่มเอกสาร
              </Button>
            </div>

            {formData.requiredDocuments.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">ยังไม่มีเอกสารที่ต้องแนบ</p>
            ) : (
              <div className="space-y-3">
                {formData.requiredDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-400 text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="ชื่อเอกสาร เช่น สำเนาบัตรประชาชน"
                        value={doc.name}
                        onChange={(e) => updateDocument(index, "name", e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={doc.isRequired}
                        onChange={(e) => updateDocument(index, "isRequired", e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="text-xs text-gray-500">จำเป็น</span>
                    </div>
                    <button
                      onClick={() => removeDocument(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
              }}
              disabled={formLoading}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={isCreateModalOpen ? handleCreate : handleUpdate}
              disabled={formLoading}
            >
              {formLoading ? "กำลังบันทึก..." : (isCreateModalOpen ? "สร้างสวัสดิการ" : "บันทึกการเปลี่ยนแปลง")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        className="max-w-md p-6"
      >
        <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
          ยืนยันการลบ
        </h2>

        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {formError}
          </div>
        )}

        {selectedWelfareType && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              คุณต้องการลบสวัสดิการ <strong className="text-gray-800 dark:text-white">{selectedWelfareType.name}</strong> หรือไม่?
            </p>
            <p className="text-sm text-gray-500">
              หากมีการเบิกสวัสดิการนี้แล้ว ระบบจะทำการปิดใช้งานแทนการลบ
            </p>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={formLoading}
              >
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
                disabled={formLoading}
              >
                {formLoading ? "กำลังลบ..." : "ยืนยันลบ"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
