"use client";

import { useSession } from "next-auth/react";
import { UserType } from "@/types/auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleBasedNavigation from "@/components/navigation/RoleBasedNavigation";
import UserInfo from "@/components/user/UserInfo";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ProtectedRoute requiredUserType={UserType.ADMIN}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/admin" className="flex items-center space-x-2">
              <Image
                src="/images/logo/welfareLogo.png"
                alt="Welfare Logo"
                width={40}
                height={40}
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex flex-col h-full">
            <nav className="flex-1 px-4 py-6 space-y-2">
              <RoleBasedNavigation />
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <UserInfo />
            </div>
          </div>
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex flex-col flex-1 lg:ml-0">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 lg:hidden"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <h1 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white lg:ml-0">
                  Welfare Management System
                </h1>
              </div>

              {/* Header actions */}
              <div className="flex items-center space-x-4">
                {/* Theme toggle and other actions can go here */}
                <div className="lg:hidden">
                  <UserInfo showDetails={false} />
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}