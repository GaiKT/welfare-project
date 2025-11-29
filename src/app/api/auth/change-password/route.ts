import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserType } from "@/types/auth";

/**
 * POST /api/auth/change-password
 * Change password (especially for first-time login)
 * Works for both Admin and User accounts
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validation
    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation are required" },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const userType = session.user.userType;

    // Handle Admin password change
    if (userType === UserType.ADMIN) {
      const admin = await prisma.admin.findUnique({
        where: { id: userId },
      });

      if (!admin) {
        return NextResponse.json(
          { error: "Admin not found" },
          { status: 404 }
        );
      }

      // Verify current password (skip for first login)
      if (!admin.isFirstLogin && currentPassword) {
        const isPasswordValid = await bcrypt.compare(
          currentPassword,
          admin.password
        );

        if (!isPasswordValid) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update admin
      await prisma.admin.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          isFirstLogin: false,
          mustChangePassword: false,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: "PASSWORD_CHANGED",
          entity: "Admin",
          entityId: userId,
          adminId: userId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Password changed successfully",
      });
    }

    // Handle User password change
    if (userType === UserType.USER) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Verify current password (skip for first login or if no password set)
      if (!user.isFirstLogin && user.password && currentPassword) {
        const isPasswordValid = await bcrypt.compare(
          currentPassword,
          user.password
        );

        if (!isPasswordValid) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          isFirstLogin: false,
          mustChangePassword: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Password changed successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid user type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
