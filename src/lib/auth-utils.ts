import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminRole } from "@/types/next-auth";

/**
 * Get current session server-side
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

/**
 * Get current admin or throw error
 */
export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session || !session.user) {
    throw new Error("Authentication required");
  }
  return session;
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: AdminRole, requiredRole: AdminRole): boolean {
  const roleHierarchy = {
    [AdminRole.MODERATOR]: 1,
    [AdminRole.ADMIN]: 2,
    [AdminRole.SUPER_ADMIN]: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Require specific role
 */
export async function requireRole(requiredRole: AdminRole) {
  const session = await requireAuth();
  
  if (!hasRole(session.user.role, requiredRole)) {
    throw new Error("Insufficient permissions");
  }
  
  return session;
}

/**
 * Check if user can access resource
 */
export async function canAccessResource(resourceOwnerId?: string) {
  const session = await requireAuth();
  
  // Super admins can access everything
  if (session.user.role === AdminRole.SUPER_ADMIN) {
    return true;
  }
  
  // Users can access their own resources
  if (resourceOwnerId && session.user.id === resourceOwnerId) {
    return true;
  }
  
  return false;
}

/**
 * Create error response
 */
export function createErrorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Auth wrapper for API routes
 */
export function withAuth<T extends any[]>(
  handler: (...args: T) => Promise<Response>,
  options?: {
    requiredRole?: AdminRole;
    allowSelf?: boolean;
  }
) {
  return async (...args: T): Promise<Response> => {
    try {
      const session = await getCurrentSession();
      
      if (!session || !session.user) {
        return createErrorResponse("Authentication required", 401);
      }

      // Check role requirement
      if (options?.requiredRole && !hasRole(session.user.role, options.requiredRole)) {
        return createErrorResponse("Insufficient permissions", 403);
      }

      return await handler(...args);
    } catch (error) {
      console.error("Auth wrapper error:", error);
      return createErrorResponse("Internal server error", 500);
    }
  };
}
