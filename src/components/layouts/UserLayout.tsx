"use client";

import { UserType } from "@/types/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface UserLayoutProps {
  children: React.ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {

  return (
    <ProtectedRoute requiredUserType={UserType.USER}>
      {/* Page content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </ProtectedRoute>
  );
}