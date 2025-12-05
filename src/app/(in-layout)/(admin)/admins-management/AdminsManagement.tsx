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
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { PageLoading } from "@/components/ui/loading";

const _inputClassName = "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white";

interface Admin {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: "PRIMARY" | "ADMIN" | "MANAGER";
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface AdminFormData {
  username: string;
  email: string;
  name: string;
  password: string;
  role: "ADMIN" | "MANAGER";
  isActive: boolean;
}

const initialFormData: AdminFormData = {
  username: "",
  email: "",
  name: "",
  password: "",
  role: "ADMIN",
  isActive: true,
};

const roleLabels: Record<string, string> = {
  PRIMARY: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
};

const roleColors: Record<string, "error" | "warning" | "info" | "success"> = {
  PRIMARY: "error",
  ADMIN: "warning",
  MANAGER: "info",
};

export default function AdminsManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState<AdminFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admins-management");
      const result = await response.json();

      if (response.ok) {
        setAdmins(result.admins);
      } else {
        setError(result.error || "Failed to fetch admins");
      }
    } catch (err) {
      setError("Failed to fetch admins");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/admins-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setIsCreateModalOpen(false);
        setFormData(initialFormData);
        fetchAdmins();
      } else {
        alert(result.error || "Failed to create admin");
      }
    } catch (err) {
      alert("Failed to create admin");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/admins-management/${selectedAdmin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setIsEditModalOpen(false);
        setSelectedAdmin(null);
        setFormData(initialFormData);
        fetchAdmins();
      } else {
        alert(result.error || "Failed to update admin");
      }
    } catch (err) {
      alert("Failed to update admin");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    setSubmitting(true);

    try {
      const response = await fetch(`/api/admins-management/${selectedAdmin.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        setIsDeleteModalOpen(false);
        setSelectedAdmin(null);
        fetchAdmins();
      } else {
        alert(result.error || "Failed to delete admin");
      }
    } catch (err) {
      alert("Failed to delete admin");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setFormData({
      username: admin.username,
      email: admin.email || "",
      name: admin.name || "",
      password: "",
      role: admin.role === "PRIMARY" ? "ADMIN" : admin.role,
      isActive: admin.isActive,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.name && admin.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (admin.email && admin.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
            จัดการผู้ดูแลระบบ
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            จัดการข้อมูล Admin และ Manager ในระบบ
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData(initialFormData);
            setIsCreateModalOpen(true);
          }}
        >
          + เพิ่มผู้ดูแลระบบ
        </Button>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <Input
          type="text"
          placeholder="ค้นหาด้วย Username, ชื่อ หรือ อีเมล..."
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Admins Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Username
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  ชื่อ
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  อีเมล
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  บทบาท
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  สถานะ
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  เข้าใช้งานล่าสุด
                </TableCell>
                <TableCell isHeader className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                  จัดการ
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-white">
                      {admin.username}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                      {admin.name || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {admin.email || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge color={roleColors[admin.role]} size="sm">
                        {roleLabels[admin.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge color={admin.isActive ? "success" : "error"} size="sm">
                        {admin.isActive ? "ใช้งาน" : "ระงับ"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(admin.lastLogin)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(admin)}
                          className="rounded-lg p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                          disabled={admin.role === "PRIMARY"}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDeleteModal(admin)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={admin.role === "PRIMARY"}
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
                    ไม่พบข้อมูลผู้ดูแลระบบ
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
          เพิ่มผู้ดูแลระบบใหม่
        </h2>
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <Label>Username *</Label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <Label>ชื่อ</Label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <Label>อีเมล</Label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <Label>รหัสผ่าน *</Label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <Label>บทบาท *</Label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
            </select>
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
          แก้ไขข้อมูลผู้ดูแลระบบ
        </h2>
        <form onSubmit={handleEditAdmin} className="space-y-4">
          <div>
            <Label>Username *</Label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <Label>ชื่อ</Label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <Label>อีเมล</Label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <Label>รหัสผ่านใหม่</Label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="เว้นว่างถ้าไม่ต้องการเปลี่ยนรหัสผ่าน"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </div>
          <div>
            <Label>บทบาท *</Label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isActive">เปิดใช้งาน</Label>
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
          คุณต้องการลบผู้ดูแลระบบ{" "}
          <span className="font-semibold">
            {selectedAdmin?.name || selectedAdmin?.username}
          </span>{" "}
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
            onClick={handleDeleteAdmin}
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
