import { useSession } from "next-auth/react";
import { AdminRole } from "@/types/auth";

/**
 * Hook to get current session with type safety
 */
export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: !!session,
    status
  };
}

/**
 * Hook to check if user has required role
 */
export function useRole(requiredRole: AdminRole) {
  const { user, isLoading } = useAuth();
  
  const hasRequiredRole = user && user.role ? hasRole(user.role, requiredRole) : false;
  
  return {
    hasRole: hasRequiredRole,
    isLoading,
    user
  };
}

/**
 * Hook to check if user is super admin
 */
export function useSuperAdmin() {
  return useRole(AdminRole.SUPER_ADMIN);
}

/**
 * Hook to check if user is admin or above
 */
export function useAdmin() {
  return useRole(AdminRole.ADMIN);
}

/**
 * Helper function to check role hierarchy
 */
function hasRole(userRole: AdminRole, requiredRole: AdminRole): boolean {
  const roleHierarchy = {
    [AdminRole.MODERATOR]: 1,
    [AdminRole.ADMIN]: 2,
    [AdminRole.SUPER_ADMIN]: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
