import type { Metadata } from "next";
import GeneralSettings from "./GeneralSettings";

export const metadata: Metadata = {
  title: "ตั้งค่าทั่วไป - Welfare",
  description: "หน้าตั้งค่าทั่วไปของระบบสวัสดิการ",
};

export default function SettingsPage() {
  return <GeneralSettings />;
}
