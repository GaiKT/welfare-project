"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { UserType, AdminRole } from "@/types/auth";

interface UserInfoProps {
  showDetails?: boolean;
  className?: string;
}

export default function UserInfo({ showDetails = true, className = "" }: UserInfoProps) {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  const getRoleDisplay = () => {
    if (user.userType === UserType.ADMIN) {
      switch (user.role) {
        case AdminRole.SUPER_ADMIN:
          return "Super Administrator";
        case AdminRole.ADMIN:
          return "Administrator";
        case AdminRole.MODERATOR:
          return "Moderator";
        default:
          return "Admin";
      }
    }
    return "Employee";
  };

  const getUserDisplayName = () => {
    if (user.userType === UserType.ADMIN) {
      return user.name || user.username || "Admin";
    }
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
  };

  const getUserIdentifier = () => {
    if (user.userType === UserType.ADMIN) {
      return user.username || user.email;
    }
    return user.identity;
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* User Avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
          {user.image ? (
            <Image
              src={user.image}
              alt="User avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <span className="text-white text-sm font-medium">
              {getUserDisplayName().charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* User Details */}
      {showDetails && (
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {getRoleDisplay()} {getUserIdentifier() && `• ${getUserIdentifier()}`}
              </p>
            </div>
            
            <button
              onClick={handleSignOut}
              className="ml-2 px-2 py-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              title="Sign out"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for header/nav bar
export function UserInfoCompact() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  const getUserDisplayName = () => {
    if (user.userType === UserType.ADMIN) {
      return user.name || user.username || "Admin";
    }
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="w-6 h-6 bg-brand-500 rounded-full flex items-center justify-center">
        {user.image ? (
          <Image
            src={user.image}
            alt="User avatar"
            width={24}
            height={24}
            className="rounded-full"
          />
        ) : (
          <span className="text-white text-xs font-medium">
            {getUserDisplayName().charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-1">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {getUserDisplayName()}
        </span>
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          title="Sign out"
        >
          ×
        </button>
      </div>
    </div>
  );
}