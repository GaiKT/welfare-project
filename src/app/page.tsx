"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserType } from "@/types/auth";
import { PageLoading } from "@/components/ui/loading";

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") {
      // Still loading, don't redirect yet
      return;
    }

    if (!session) {
      // Not authenticated, redirect to sign in
      router.replace("/signin");
      return;
    }

    // Authenticated, redirect based on user type
    if (session.user.userType === UserType.ADMIN) {
      router.replace("/dashboard");
    } else if (session.user.userType === UserType.USER) {
      router.replace("/dashboard");
    } else {
      // Fallback, redirect to sign in
      router.replace("/signin");
    }
  }, [session, status, router]);

  // Show loading state while determining where to redirect
  return <PageLoading text="กำลังโหลด..." fullScreen />;
}