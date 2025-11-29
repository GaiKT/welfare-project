export enum AdminRole {
  PRIMARY = "PRIMARY",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER"
}

export enum UserType {
  ADMIN = "ADMIN",
  USER = "USER"
}

export enum ClaimStatus {
  PENDING = "PENDING",
  IN_REVIEW = "IN_REVIEW",
  ADMIN_APPROVED = "ADMIN_APPROVED",
  MANAGER_APPROVED = "MANAGER_APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED"
}

export enum NotificationType {
  CLAIM_SUBMITTED = "CLAIM_SUBMITTED",
  CLAIM_APPROVED = "CLAIM_APPROVED",
  CLAIM_REJECTED = "CLAIM_REJECTED",
  CLAIM_COMMENT = "CLAIM_COMMENT",
  CLAIM_COMPLETED = "CLAIM_COMPLETED",
  SYSTEM = "SYSTEM"
}

// Extended user types for NextAuth
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  userType: UserType;
}

export interface AuthAdmin extends AuthUser {
  username: string;
  role: AdminRole;
  image?: string | null;
  isFirstLogin?: boolean;
  mustChangePassword?: boolean;
  signatureUrl?: string | null;
}

export interface AuthRegularUser extends AuthUser {
  identity: string;
  firstName: string;
  lastName: string;
  isFirstLogin?: boolean;
  mustChangePassword?: boolean;
}