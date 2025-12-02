"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loginType, setLoginType] = useState<"admin" | "user">("admin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  // Show success message if password was just changed
  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "password-changed") {
      setSuccessMessage("เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
    } else if (message === "password-reset-success") {
      setSuccessMessage("รีเซ็ตรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
      toast.success("รีเซ็ตรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่");
    }
  }, [searchParams]);

  // Check if user needs to change password after session is loaded
  useEffect(() => {
    if (status === "authenticated" && session?.user?.mustChangePassword) {
      router.push("/reset-password");
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setFieldErrors({});
    setSuccessMessage("");

    // Client-side validation
    const errors: { identifier?: string; password?: string } = {};
    if (!identifier.trim()) {
      errors.identifier = loginType === "admin" 
        ? "กรุณากรอกชื่อผู้ใช้หรืออีเมล" 
        : "กรุณากรอกรหัสสมาชิก";
    }
    if (!password) {
      errors.password = "กรุณากรอกรหัสผ่าน";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn(
        loginType === "admin" ? "admin-credentials" : "user-credentials",
        {
          [loginType === "admin" ? "username" : "identity"]: identifier,
          password,
          redirect: false,
        }
      );

      if (result?.error) {
        // Determine which field has error based on error message
        if (result.error.toLowerCase().includes("password") || 
            result.error.toLowerCase().includes("รหัสผ่าน")) {
          setFieldErrors({ password: "รหัสผ่านไม่ถูกต้อง" });
        } else if (result.error.toLowerCase().includes("credentials") || 
                   result.error.toLowerCase().includes("invalid")) {
          setFieldErrors({ 
            identifier: loginType === "admin" 
              ? "ชื่อผู้ใช้หรืออีเมลไม่ถูกต้อง" 
              : "รหัสสมาชิกไม่ถูกต้อง",
            password: "หรือรหัสผ่านไม่ถูกต้อง"
          });
        } else {
          setError(result.error);
        }
        toast.error("เข้าสู่ระบบไม่สำเร็จ");
        setIsLoading(false);
      } else if (result?.ok) {
        // Fetch session to check mustChangePassword
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        
        if (sessionData?.user?.mustChangePassword) {
          // Redirect to reset password page
          toast.info("กรุณาตั้งรหัสผ่านใหม่เพื่อความปลอดภัย");
          router.push("/reset-password");
        } else {
          // Redirect based on user type
          toast.success("เข้าสู่ระบบสำเร็จ!");
          if (loginType === "admin") {
            router.push("/dashboard-admin");
          } else {
            router.push("/dashboard");
          }
        }
      }
    } catch {
      setError("An unexpected error occurred");
      toast.error("มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="flex items-center max-md:justify-center mb-3">
            <Image
              width={100}
              height={100}
              src="/images/logo/welfareLogo.png"
              alt="Logo"
              className="lg:hidden"
            />            
            <div className="flex flex-col justify-center ml-3">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                เข้าสู่ระบบ
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                กรุณาใส่ข้อมูลประจำตัวของคุณเพื่อเข้าถึงระบบสวัสดิการ
              </p>
            </div>
          </div>
          
          {/* Login Type Selector */}
          <div className="mb-6">
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <button
                type="button"
                onClick={() => setLoginType("admin")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === "admin"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                ผู้ดูแลระบบ
              </button>
              <button
                type="button"
                onClick={() => setLoginType("user")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  loginType === "user"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                สมาชิก
              </button>
            </div>
          </div>

          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {successMessage && (
                  <div className="p-3 text-sm text-green-600 bg-green-100 rounded-md dark:bg-green-900/30 dark:text-green-400">
                    {successMessage}
                  </div>
                )}
                
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-400">
                    {error}
                  </div>
                )}
                
                <div>
                  <Label>
                    {loginType === "admin" ? "ชื่อผู้ใช้/อีเมล" : "รหัสสมาชิก"} <span className="text-error-500">*</span>
                  </Label>
                  <input
                    placeholder={loginType === "admin" ? "admin@company.com" : "EMP001"}
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
                    }}
                    required
                    className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 ${
                      fieldErrors.identifier 
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" 
                        : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                    }`}
                  />
                  {fieldErrors.identifier && (
                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {fieldErrors.identifier}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label>
                    รหัสผ่าน <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="************"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      required
                      className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 ${
                        fieldErrors.password 
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/10" 
                          : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                      }`}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      จำฉันไว้
                    </span>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    ลืมรหัสผ่าน?
                  </Link>
                </div>
                
                <div>
                  <button 
                    className="w-full h-11 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors" 
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
