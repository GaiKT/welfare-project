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

export async function requireSuperAdmin() {
  const user = await requireAdmin();
  if (user.role !== AdminRole.SUPER_ADMIN) {
    throw new Error("Super admin access required");
  }
  return user;
}

export function hasPermission(userRole: AdminRole, requiredRole: AdminRole): boolean {
  const roleHierarchy = {
    [AdminRole.SUPER_ADMIN]: 3,
    [AdminRole.ADMIN]: 2,
    [AdminRole.MODERATOR]: 1,
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
  return role === AdminRole.SUPER_ADMIN;
}

export function canViewAuditLogs(role: AdminRole): boolean {
  return hasPermission(role, AdminRole.ADMIN);
}