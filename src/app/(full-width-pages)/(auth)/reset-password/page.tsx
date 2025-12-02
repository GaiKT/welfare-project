"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EyeIcon, EyeCloseIcon } from "@/icons";
import { UserType } from "@/types/auth";
import { toast } from "react-toastify";

export default function ResetPasswordPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // If not authenticated, redirect to signin
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }

    // If authenticated but doesn't need password change, redirect to dashboard
    if (status === "authenticated" && session?.user && !session.user.mustChangePassword) {
      const redirectPath = session.user.userType === UserType.ADMIN 
        ? "/dashboard-admin" 
        : "/dashboard";
      router.push(redirectPath);
    }
  }, [status, session, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    }
    if (!/[A-Z]/.test(password)) {
      return "รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว";
    }
    if (!/[a-z]/.test(password)) {
      return "รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว";
    }
    if (!/[0-9]/.test(password)) {
      return "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      toast.error("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      toast.error(passwordError);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast.success("เปลี่ยนรหัสผ่านสำเร็จ!");
        
        // Update the session to reflect the password change
        await update({
          ...session,
          user: {
            ...session?.user,
            isFirstLogin: false,
            mustChangePassword: false,
          },
        });

        // Redirect to appropriate dashboard after a short delay
        setTimeout(() => {
          const redirectPath = session?.user?.userType === "ADMIN" 
            ? "/dashboard-admin" 
            : "/dashboard";
          router.push(redirectPath);
        }, 1500);
      } else {
        const errorMessage = data.error || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch {
      const errorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  // Don't render if not authenticated or doesn't need password change
  if (!session?.user?.mustChangePassword) {
    return null;
  }

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
                ตั้งรหัสผ่านใหม่
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                เนื่องจากคุณเข้าสู่ระบบครั้งแรก กรุณาตั้งรหัสผ่านใหม่เพื่อความปลอดภัย
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
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
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">ข้อกำหนดรหัสผ่าน:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
                  <li>มีความยาวอย่างน้อย 8 ตัวอักษร</li>
                  <li>มีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว (A-Z)</li>
                  <li>มีตัวพิมพ์เล็กอย่างน้อย 1 ตัว (a-z)</li>
                  <li>มีตัวเลขอย่างน้อย 1 ตัว (0-9)</li>
                </ul>
              </div>
            </div>
          </div>

          {success ? (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div>
                  <p className="text-green-700 dark:text-green-300 font-medium">
                    เปลี่ยนรหัสผ่านสำเร็จ!
                  </p>
                  <p className="text-green-600 dark:text-green-400 text-sm">
                    กำลังนำคุณไปยังหน้าหลัก...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-400">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    รหัสผ่านใหม่ <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      placeholder="กรอกรหัสผ่านใหม่"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      required
                      className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
                    />
                    <span
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showNewPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ยืนยันรหัสผ่านใหม่ <span className="text-error-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700"
                    />
                    <span
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <button
                    className="w-full h-11 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านใหม่"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
