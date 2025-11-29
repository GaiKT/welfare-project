"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { UserType, AdminRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: UserType;
  requiredRole?: AdminRole;
  fallbackUrl?: string;
}

export default function ProtectedRoute({
  children,
  requiredUserType,
  requiredRole,
  fallbackUrl = "/signin",
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push(fallbackUrl);
      return;
    }

    const user = session.user;

    // Check user type requirement
    if (requiredUserType && user.userType !== requiredUserType) {
      router.push("/unauthorized");
      return;
    }

    // Check admin role requirement
    if (requiredRole && user.userType === UserType.ADMIN) {
      const roleHierarchy = {
        [AdminRole.PRIMARY]: 3,
        [AdminRole.MANAGER]: 2,
        [AdminRole.ADMIN]: 1,
      };

      const userRoleLevel = roleHierarchy[user.role!];
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [session, status, router, requiredUserType, requiredRole, fallbackUrl]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}