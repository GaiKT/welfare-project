"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserType, AdminRole } from "@/types/auth";

interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  requiredUserType?: UserType;
  requiredRole?: AdminRole;
}

const navigationItems: NavigationItem[] = [
  // Admin navigation
  {
    name: "Admin Dashboard",
    href: "/dashboard-admin",
    requiredUserType: UserType.ADMIN,
  },
  {
    name: "Users Management",
    href: "/users-management",
    requiredUserType: UserType.ADMIN,
    requiredRole: AdminRole.PRIMARY,
  },
  {
    name: "Admin Management",
    href: "/admin-management",
    requiredUserType: UserType.ADMIN,
    requiredRole: AdminRole.PRIMARY,
  },
  {
    name: "Welfare Management",
    href: "/welfare-management",
    requiredUserType: UserType.ADMIN,
    requiredRole: AdminRole.ADMIN,
  },
  {
    name: "Claims Management",
    href: "/claims",
    requiredUserType: UserType.ADMIN,
    requiredRole: AdminRole.ADMIN,
  },
  {
    name: "Reports",
    href: "/reports",
    requiredUserType: UserType.ADMIN,
    requiredRole: AdminRole.ADMIN,
  },

  // User navigation
  {
    name: "Dashboard",
    href: "/dashboard",
    requiredUserType: UserType.USER,
  },
  {
    name: "Welfare Programs",
    href: "/welfare",
    requiredUserType: UserType.USER,
  },
  {
    name: "My Claims",
    href: "/claims",
    requiredUserType: UserType.USER,
  },
  {
    name: "Profile",
    href: "/profile",
    requiredUserType: UserType.USER,
  },
];

interface RoleBasedNavigationProps {
  className?: string;
}

export default function RoleBasedNavigation({ className = "" }: RoleBasedNavigationProps) {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  const hasPermission = (item: NavigationItem): boolean => {
    // Check user type requirement
    if (item.requiredUserType && user.userType !== item.requiredUserType) {
      return false;
    }

    // Check admin role requirement
    if (item.requiredRole && user.userType === UserType.ADMIN) {
      const roleHierarchy = {
        [AdminRole.PRIMARY]: 3,
        [AdminRole.MANAGER]: 2,
        [AdminRole.ADMIN]: 1,
      };

      const userRoleLevel = roleHierarchy[user.role!];
      const requiredRoleLevel = roleHierarchy[item.requiredRole];

      return userRoleLevel >= requiredRoleLevel;
    }

    return true;
  };

  const filteredItems = navigationItems.filter(hasPermission);

  return (
    <nav className={`space-y-1 ${className}`}>
      {filteredItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? "bg-brand-100 text-brand-900 dark:bg-brand-900/20 dark:text-brand-100"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            }`}
          >
            {item.icon && (
              <span className={`mr-3 flex h-5 w-5 ${
                isActive ? "text-brand-500" : "text-gray-400 group-hover:text-gray-500"
              }`}>
                {item.icon}
              </span>
            )}
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

// Hook to get filtered navigation items
export function useRoleBasedNavigation() {
  const { data: session } = useSession();

  if (!session?.user) {
    return [];
  }

  const user = session.user;

  const hasPermission = (item: NavigationItem): boolean => {
    if (item.requiredUserType && user.userType !== item.requiredUserType) {
      return false;
    }

    if (item.requiredRole && user.userType === UserType.ADMIN) {
      const roleHierarchy = {
        [AdminRole.PRIMARY]: 3,
        [AdminRole.MANAGER]: 2,
        [AdminRole.ADMIN]: 1,
      };

      const userRoleLevel = roleHierarchy[user.role!];
      const requiredRoleLevel = roleHierarchy[item.requiredRole];

      return userRoleLevel >= requiredRoleLevel;
    }

    return true;
  };

  return navigationItems.filter(hasPermission);
}