import type { Metadata } from "next";
import UsersManagement from "./UsersManagement";

export const metadata: Metadata = {
  title: "จัดการผู้ใช้งาน - Welfare",
  description: "หน้าจัดการข้อมูลผู้ใช้งานในระบบสวัสดิการ",
};

export default function UsersManagementPage() {
  return <UsersManagement />;
}
