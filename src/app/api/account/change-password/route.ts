import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserType } from "@/types/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    let user;

    // Get user based on user type
    if (session.user.userType === UserType.ADMIN) {
      user = await prisma.admin.findUnique({
        where: { id: userId },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password || "");
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password based on user type
    if (session.user.userType === UserType.ADMIN) {
      await prisma.admin.update({
        where: { id: userId },
        data: { 
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: { 
          password: hashedNewPassword,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(
      { message: "Password changed successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}