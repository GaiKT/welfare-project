import { DefaultSession, DefaultUser } from "next-auth";
import { AdminRole, UserType } from "./auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
      identity?: string;
      role?: AdminRole;
      userType: UserType;
      firstName?: string;
      lastName?: string;
      isFirstLogin?: boolean;
      mustChangePassword?: boolean;
      signatureUrl?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username?: string;
    identity?: string;
    role?: AdminRole;
    userType: UserType;
    firstName?: string;
    lastName?: string;
    isFirstLogin?: boolean;
    mustChangePassword?: boolean;
    signatureUrl?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username?: string;
    identity?: string;
    role?: AdminRole;
    userType: UserType;
    firstName?: string;
    lastName?: string;
    isFirstLogin?: boolean;
    mustChangePassword?: boolean;
    signatureUrl?: string | null;
    image?: string | null;
  }
}
