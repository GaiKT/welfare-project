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
 * Hook to check if user is primary admin
 */
export function usePrimaryAdmin() {
  return useRole(AdminRole.PRIMARY);
}

/**
 * Hook to check if user is manager or above
 */
export function useManager() {
  return useRole(AdminRole.MANAGER);
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
    [AdminRole.ADMIN]: 1,
    [AdminRole.MANAGER]: 2,
    [AdminRole.PRIMARY]: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
