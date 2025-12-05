"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/button/Button";

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const settingSections: SettingSection[] = [
  {
    id: "general",
    title: "ตั้งค่าทั่วไป",
    description: "ตั้งค่าพื้นฐานของระบบ",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "notifications",
    title: "การแจ้งเตือน",
    description: "ตั้งค่าการแจ้งเตือนของระบบ",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    id: "fiscal-year",
    title: "ปีงบประมาณ",
    description: "ตั้งค่าปีงบประมาณและรอบการคำนวณ",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "approval",
    title: "การอนุมัติ",
    description: "ตั้งค่ากระบวนการอนุมัติคำร้อง",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const inputClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white";

const selectClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white";

export default function GeneralSettings() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // General settings state
  const [generalSettings, setGeneralSettings] = useState({
    systemName: "ระบบสวัสดิการพนักงาน",
    companyName: "บริษัท ตัวอย่าง จำกัด",
    contactEmail: "admin@example.com",
    contactPhone: "02-xxx-xxxx",
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newClaimAlert: true,
    approvalAlert: true,
    rejectionAlert: true,
    systemAlert: true,
  });

  // Fiscal year settings state
  const [fiscalYearSettings, setFiscalYearSettings] = useState({
    fiscalYearStart: "07", // July
    currentFiscalYear: new Date().getFullYear().toString(),
    autoResetQuota: true,
  });

  // Approval settings state
  const [approvalSettings, setApprovalSettings] = useState({
    requireAdminApproval: true,
    requireManagerApproval: true,
    autoApproveThreshold: "0",
    maxClaimAmount: "50000",
  });

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Simulate API call - in production, this would save to database
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setMessage({ type: "success", text: "บันทึกการตั้งค่าสำเร็จ" });
    } catch {
      setMessage({ type: "error", text: "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า" });
    } finally {
      setIsSaving(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          ชื่อระบบ
        </label>
        <input
          type="text"
          value={generalSettings.systemName}
          onChange={(e) =>
            setGeneralSettings({ ...generalSettings, systemName: e.target.value })
          }
          className={inputClassName}
          placeholder="ชื่อระบบ"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          ชื่อบริษัท/องค์กร
        </label>
        <input
          type="text"
          value={generalSettings.companyName}
          onChange={(e) =>
            setGeneralSettings({ ...generalSettings, companyName: e.target.value })
          }
          className={inputClassName}
          placeholder="ชื่อบริษัท/องค์กร"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          อีเมลติดต่อ
        </label>
        <input
          type="email"
          value={generalSettings.contactEmail}
          onChange={(e) =>
            setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })
          }
          className={inputClassName}
          placeholder="admin@example.com"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          เบอร์โทรศัพท์ติดต่อ
        </label>
        <input
          type="tel"
          value={generalSettings.contactPhone}
          onChange={(e) =>
            setGeneralSettings({ ...generalSettings, contactPhone: e.target.value })
          }
          className={inputClassName}
          placeholder="02-xxx-xxxx"
        />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div>
          <p className="font-medium text-gray-800 dark:text-white">เปิดใช้งานการแจ้งเตือนทางอีเมล</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">ส่งการแจ้งเตือนผ่านทางอีเมล</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={notificationSettings.emailNotifications}
            onChange={(e) =>
              setNotificationSettings({
                ...notificationSettings,
                emailNotifications: e.target.checked,
              })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
        </label>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div>
          <p className="font-medium text-gray-800 dark:text-white">แจ้งเตือนคำร้องใหม่</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">รับการแจ้งเตือนเมื่อมีคำร้องใหม่</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={notificationSettings.newClaimAlert}
            onChange={(e) =>
              setNotificationSettings({
                ...notificationSettings,
                newClaimAlert: e.target.checked,
              })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
        </label>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div>
          <p className="font-medium text-gray-800 dark:text-white">แจ้งเตือนการอนุมัติ</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">รับการแจ้งเตือนเมื่อคำร้องได้รับการอนุมัติ</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={notificationSettings.approvalAlert}
            onChange={(e) =>
              setNotificationSettings({
                ...notificationSettings,
                approvalAlert: e.target.checked,
              })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
        </label>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div>
          <p className="font-medium text-gray-800 dark:text-white">แจ้งเตือนการปฏิเสธ</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">รับการแจ้งเตือนเมื่อคำร้องถูกปฏิเสธ</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={notificationSettings.rejectionAlert}
            onChange={(e) =>
              setNotificationSettings({
                ...notificationSettings,
                rejectionAlert: e.target.checked,
              })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
        </label>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div>
          <p className="font-medium text-gray-800 dark:text-white">แจ้งเตือนระบบ</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">รับการแจ้งเตือนจากระบบ</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={notificationSettings.systemAlert}
            onChange={(e) =>
              setNotificationSettings({
                ...notificationSettings,
                systemAlert: e.target.checked,
              })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
        </label>
      </div>
    </div>
  );

  const renderFiscalYearSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          เดือนเริ่มต้นปีงบประมาณ
        </label>
        <select
          value={fiscalYearSettings.fiscalYearStart}
          onChange={(e) =>
            setFiscalYearSettings({ ...fiscalYearSettings, fiscalYearStart: e.target.value })
          }
          className={selectClassName}
        >
          <option value="01">มกราคม</option>
          <option value="02">กุมภาพันธ์</option>
          <option value="03">มีนาคม</option>
          <option value="04">เมษายน</option>
          <option value="05">พฤษภาคม</option>
          <option value="06">มิถุนายน</option>
          <option value="07">กรกฎาคม</option>
          <option value="08">สิงหาคม</option>
          <option value="09">กันยายน</option>
          <option value="10">ตุลาคม</option>
          <option value="11">พฤศจิกายน</option>
          <option value="12">ธันวาคม</option>
        </select>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          ปีงบประมาณจะเริ่มต้นในเดือนที่เลือกและสิ้นสุดเมื่อครบ 12 เดือน
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          ปีงบประมาณปัจจุบัน
        </label>
        <input
          type="number"
          value={fiscalYearSettings.currentFiscalYear}
          onChange={(e) =>
            setFiscalYearSettings({ ...fiscalYearSettings, currentFiscalYear: e.target.value })
          }
          className={inputClassName}
          min="2000"
          max="2100"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          ระบุปีงบประมาณที่ใช้งานอยู่ในปัจจุบัน (เช่น 2568)
        </p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div>
          <p className="font-medium text-gray-800 dark:text-white">รีเซ็ตโควต้าอัตโนมัติ</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            รีเซ็ตโควต้าสวัสดิการอัตโนมัติเมื่อเริ่มปีงบประมาณใหม่
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={fiscalYearSettings.autoResetQuota}
            onChange={(e) =>
              setFiscalYearSettings({
                ...fiscalYearSettings,
                autoResetQuota: e.target.checked,
              })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
        </label>
      </div>
    </div>
  );

  const renderApprovalSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div>
          <p className="font-medium text-gray-800 dark:text-white">ต้องการการอนุมัติจาก Admin</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            คำร้องต้องได้รับการอนุมัติจาก Admin ก่อน
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={approvalSettings.requireAdminApproval}
            onChange={(e) =>
              setApprovalSettings({
                ...approvalSettings,
                requireAdminApproval: e.target.checked,
              })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
        </label>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div>
          <p className="font-medium text-gray-800 dark:text-white">ต้องการการอนุมัติจาก Manager</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            คำร้องต้องได้รับการอนุมัติจาก Manager ด้วย
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={approvalSettings.requireManagerApproval}
            onChange={(e) =>
              setApprovalSettings({
                ...approvalSettings,
                requireManagerApproval: e.target.checked,
              })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
        </label>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          จำนวนเงินอนุมัติอัตโนมัติ (บาท)
        </label>
        <input
          type="number"
          value={approvalSettings.autoApproveThreshold}
          onChange={(e) =>
            setApprovalSettings({ ...approvalSettings, autoApproveThreshold: e.target.value })
          }
          className={inputClassName}
          min="0"
          step="100"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          คำร้องที่มีจำนวนเงินต่ำกว่านี้จะได้รับการอนุมัติอัตโนมัติ (0 = ปิดใช้งาน)
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          จำนวนเงินสูงสุดต่อคำร้อง (บาท)
        </label>
        <input
          type="number"
          value={approvalSettings.maxClaimAmount}
          onChange={(e) =>
            setApprovalSettings({ ...approvalSettings, maxClaimAmount: e.target.value })
          }
          className={inputClassName}
          min="0"
          step="1000"
        />
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          จำกัดจำนวนเงินสูงสุดที่สามารถเบิกได้ต่อคำร้อง (0 = ไม่จำกัด)
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return renderGeneralSettings();
      case "notifications":
        return renderNotificationSettings();
      case "fiscal-year":
        return renderFiscalYearSettings();
      case "approval":
        return renderApprovalSettings();
      default:
        return renderGeneralSettings();
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            ตั้งค่าทั่วไป
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            จัดการการตั้งค่าระบบสวัสดิการ
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-success-50 text-success-700 border border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800"
              : "bg-error-50 text-error-700 border border-error-200 dark:bg-error-900/20 dark:text-error-400 dark:border-error-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <nav className="space-y-1">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? "bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <span
                    className={`${
                      activeSection === section.id
                        ? "text-brand-600 dark:text-brand-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {section.icon}
                  </span>
                  <div>
                    <p className="font-medium">{section.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {section.description}
                    </p>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
              {settingSections.find((s) => s.id === activeSection)?.title}
            </h2>

            {renderContent()}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกการตั้งค่า"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
