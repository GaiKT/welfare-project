import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminRole, UserType } from "@/types/auth";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.userType !== UserType.ADMIN) {
    throw new Error("Admin access required");
  }
  return user;
}

export async function requirePrimaryAdmin() {
  const user = await requireAdmin();
  if (user.role !== AdminRole.PRIMARY) {
    throw new Error("Primary admin access required");
  }
  return user;
}

// Alias for backward compatibility
export const requireSuperAdmin = requirePrimaryAdmin;

export function hasPermission(userRole: AdminRole, requiredRole: AdminRole): boolean {
  const roleHierarchy = {
    [AdminRole.PRIMARY]: 3,
    [AdminRole.MANAGER]: 2,
    [AdminRole.ADMIN]: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canManageUsers(role: AdminRole): boolean {
  return hasPermission(role, AdminRole.ADMIN);
}

export function canManageWelfare(role: AdminRole): boolean {
  return hasPermission(role, AdminRole.ADMIN);
}

export function canManageAdmins(role: AdminRole): boolean {
  return role === AdminRole.PRIMARY;
}

export function canViewAuditLogs(role: AdminRole): boolean {
  return hasPermission(role, AdminRole.ADMIN);
}