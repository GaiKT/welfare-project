"use client";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import PasswordResetCard from "@/components/user-profile/PasswordResetCard";
import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/components/ui/loading";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return <PageLoading text="กำลังโหลด..." fullScreen />;
  }

  if (!session) {
    router.push("/signin");
    return null;
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            โปรไฟล์ผู้ใช้
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ
          </p>
        </div>
        <div className="space-y-6">
          <UserMetaCard />
          <UserInfoCard />
          <PasswordResetCard />
        </div>
      </div>
    </div>
  );
}
