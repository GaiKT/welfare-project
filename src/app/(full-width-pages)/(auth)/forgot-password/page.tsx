"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userType, setUserType] = useState<"admin" | "user">("admin");
  const [formData, setFormData] = useState({
    identifier: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: formData.identifier,
          userType: userType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast.success("ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว");
      } else {
        toast.error(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="flex items-center max-md:justify-center mb-6">
            <Image
              width={100}
              height={100}
              src="/images/logo/welfareLogo.png"
              alt="Logo"
              className="lg:hidden"
            />
            <div className="flex flex-col justify-center ml-3">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                ลืมรหัสผ่าน
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                กรอกข้อมูลเพื่อรีเซ็ตรหัสผ่านของคุณ
              </p>
            </div>
          </div>

          {emailSent ? (
            <div className="space-y-6">
              {/* Success Message */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-500 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      ส่งอีเมลสำเร็จ!
                    </p>
                    <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                      กรุณาตรวจสอบอีเมลของคุณและคลิกลิงก์เพื่อรีเซ็ตรหัสผ่าน
                      หากไม่พบอีเมล กรุณาตรวจสอบในโฟลเดอร์สแปม
                    </p>
                  </div>
                </div>
              </div>

              {/* Back to Sign In */}
              <div className="text-center">
                <Link
                  href="/signin"
                  className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  กลับไปหน้าเข้าสู่ระบบ
                </Link>
              </div>

              {/* Resend Email */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  ไม่ได้รับอีเมล? ส่งอีกครั้ง
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* User Type Selector */}
              <div className="mb-6">
                <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
                  <button
                    type="button"
                    onClick={() => setUserType("admin")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      userType === "admin"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    ผู้ดูแลระบบ
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("user")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      userType === "user"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    สมาชิก
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {userType === "admin"
                          ? "กรอกชื่อผู้ใช้หรืออีเมลที่ใช้ลงทะเบียน"
                          : "กรอกรหัสสมาชิกหรืออีเมลที่ใช้ลงทะเบียน"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {userType === "admin" ? "ชื่อผู้ใช้ / อีเมล" : "รหัสสมาชิก / อีเมล"}{" "}
                      <span className="text-error-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="identifier"
                      placeholder={
                        userType === "admin"
                          ? "admin@company.com"
                          : "EMP001 หรือ email@company.com"
                      }
                      value={formData.identifier}
                      onChange={handleInputChange}
                      required
                      className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
                    />
                  </div>

                  <div>
                    <button
                      className="w-full h-11 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
                    </button>
                  </div>

                  {/* Back to Sign In */}
                  <div className="text-center">
                    <Link
                      href="/signin"
                      className="inline-flex items-center gap-2 text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium text-sm"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                      กลับไปหน้าเข้าสู่ระบบ
                    </Link>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
