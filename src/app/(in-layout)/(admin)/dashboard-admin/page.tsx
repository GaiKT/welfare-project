import type { Metadata } from "next";
import AdminDashboard from "./AdminDashboard";

export const metadata: Metadata = {
  title: "Welfare Dashboard - Admin",
  description: "แดชบอร์ดสำหรับผู้ดูแลระบบสวัสดิการ",
};

export default function DashboardPage() {
  return <AdminDashboard />;
}
