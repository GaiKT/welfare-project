export enum AdminRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR"
}

export enum UserType {
  ADMIN = "ADMIN",
  USER = "USER"
}

export enum ClaimStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED"
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
}

export interface AuthRegularUser extends AuthUser {
  identity: string;
  firstName: string;
  lastName: string;
}