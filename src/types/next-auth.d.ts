import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

export enum AdminRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR"
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: AdminRole;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    username: string;
    role: AdminRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: AdminRole;
  }
}
