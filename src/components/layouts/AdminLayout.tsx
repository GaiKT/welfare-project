"use client";

import { UserType } from "@/types/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <ProtectedRoute requiredUserType={UserType.ADMIN}>
      {/* Page content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </ProtectedRoute>
  );
}