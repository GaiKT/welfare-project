import type { Metadata } from "next";
import AuditLogPage from "./AuditLog";

export const metadata: Metadata = {
  title: "ประวัติการดำเนินการ - Welfare",
  description: "หน้าแสดงประวัติการดำเนินการในระบบสวัสดิการ",
};

export default function AuditLog() {
  return <AuditLogPage />;
}
