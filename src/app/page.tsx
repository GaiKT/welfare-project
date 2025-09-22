"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserType } from "@/types/auth";

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
      router.replace("/admin");
    } else if (session.user.userType === UserType.USER) {
      router.replace("/dashboard");
    } else {
      // Fallback, redirect to sign in
      router.replace("/signin");
    }
  }, [session, status, router]);

  // Show loading state while determining where to redirect
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}