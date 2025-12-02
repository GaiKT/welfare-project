import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserType, AdminRole, AuthAdmin, AuthRegularUser } from "@/types/auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Enter your username" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing username or password");
        }

        try {
          // Find admin by username or email
          const admin = await prisma.admin.findFirst({
            where: {
              OR: [
                { username: credentials.username },
                { email: credentials.username }
              ]
            }
          });

          if (!admin) {
            throw new Error("Invalid credentials");
          }

          // Check if admin is active
          if (!admin.isActive) {
            throw new Error("Account is deactivated");
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, admin.password);
          
          if (!isPasswordValid) {
            throw new Error("Invalid credentials");
          }

          // Update last login
          await prisma.admin.update({
            where: { id: admin.id },
            data: { lastLogin: new Date() }
          });

          // Create audit log
          await prisma.auditLog.create({
            data: {
              action: "LOGIN",
              entity: "Admin",
              entityId: admin.id,
              adminId: admin.id
            }
          });

          return {
            id: admin.id,
            name: admin.name || admin.username,
            email: admin.email,
            username: admin.username,
            role: admin.role,
            userType: UserType.ADMIN,
            image: admin.image,
            isFirstLogin: admin.isFirstLogin,
            mustChangePassword: admin.mustChangePassword,
            signatureUrl: admin.signatureUrl
          } as AuthAdmin;
        } catch (error) {
          console.error("Admin authentication error:", error);
          return null;
        }
      }
    }),
    CredentialsProvider({
      id: "user-credentials",
      name: "User Credentials", 
      credentials: {
        identity: { label: "Employee ID", type: "text", placeholder: "Enter your employee ID" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identity || !credentials?.password) {
          throw new Error("Missing employee ID or password");
        }

        try {
          // Find user by identity or email
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { identity: credentials.identity },
                { email: credentials.identity }
              ]
            }
          });

          if (!user || !user.password) {
            throw new Error("Invalid credentials");
          }

          // Check if user is active
          if (!user.isActive) {
            throw new Error("Account is deactivated");
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            throw new Error("Invalid credentials");
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          });

          return {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            identity: user.identity,
            firstName: user.firstName,
            lastName: user.lastName,
            userType: UserType.USER,
            isFirstLogin: user.isFirstLogin,
            mustChangePassword: user.mustChangePassword
          } as AuthRegularUser;
        } catch (error) {
          console.error("User authentication error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        const authUser = user as AuthAdmin | AuthRegularUser;
        token.id = authUser.id;
        token.userType = authUser.userType;
        token.isFirstLogin = authUser.isFirstLogin;
        token.mustChangePassword = authUser.mustChangePassword;
        
        if (authUser.userType === UserType.ADMIN) {
          const adminUser = authUser as AuthAdmin;
          token.username = adminUser.username;
          token.role = adminUser.role;
          token.signatureUrl = adminUser.signatureUrl;
        } else {
          const regularUser = authUser as AuthRegularUser;
          token.identity = regularUser.identity;
          token.firstName = regularUser.firstName;
          token.lastName = regularUser.lastName;
        }
      }

      // Handle session updates
      if (trigger === "update" && session) {
        token.name = session.name;
        token.email = session.email;
        // Allow updating password change status
        if (session.user?.isFirstLogin !== undefined) {
          token.isFirstLogin = session.user.isFirstLogin;
        }
        if (session.user?.mustChangePassword !== undefined) {
          token.mustChangePassword = session.user.mustChangePassword;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.userType = token.userType as UserType;
        session.user.isFirstLogin = token.isFirstLogin as boolean;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
        
        if (token.userType === UserType.ADMIN) {
          session.user.username = token.username as string;
          session.user.role = token.role as AdminRole;
          session.user.signatureUrl = token.signatureUrl as string;
        } else {
          session.user.identity = token.identity as string;
          session.user.firstName = token.firstName as string;
          session.user.lastName = token.lastName as string;
        }
      }
      return session;
    },
    async signIn() {
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  pages: {
    signIn: '/signin',
    error: '/error',
  },
  events: {
    async signOut({ token }) {
      if (token?.id && token?.userType === UserType.ADMIN) {
        // Create audit log for admin logout
        await prisma.auditLog.create({
          data: {
            action: "LOGOUT",
            entity: "Admin",
            entityId: token.id as string,
            adminId: token.id as string
          }
        });
      }
    }
  },
  debug: process.env.NODE_ENV === "development",
};
