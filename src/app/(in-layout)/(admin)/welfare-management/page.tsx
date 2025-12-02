import { Metadata } from "next";
import WelfareManagement from "./WelfareManagement";

export const metadata: Metadata = {
  title: "จัดการสวัสดิการ | Welfare Management",
  description: "Welfare Management Page",
};

export default function WelfareManagementPage() {
  return <WelfareManagement />;
}
