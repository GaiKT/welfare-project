import type { Metadata } from "next";
import AdminsManagement from "./AdminsManagement";
export const metadata: Metadata = {
  title: "จัดการผู้ดูแลระบบ - Welfare",
  description: "หน้าจัดการข้อมูลผู้ดูแลระบบสวัสดิการ",
};

export default function AdminsManagementPage() {
  return <AdminsManagement />;
}
