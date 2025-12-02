import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/reset-password-confirm
 * Reset password with valid token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userType, newPassword } = body;

    if (!token || !userType || !newPassword) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    if (userType === "admin") {
      // TODO: In production, validate token and find admin by reset token
      // For development, we'll skip token validation
      // const admin = await prisma.admin.findFirst({
      //   where: {
      //     resetToken: token,
      //     resetTokenExpiry: { gt: new Date() },
      //     isActive: true,
      //   },
      // });
      
      // if (!admin) {
      //   return NextResponse.json(
      //     { error: "Token ไม่ถูกต้องหรือหมดอายุ" },
      //     { status: 400 }
      //   );
      // }

      // For development - find first active admin (REMOVE IN PRODUCTION)
      const admin = await prisma.admin.findFirst({
        where: { isActive: true },
      });

      if (!admin) {
        return NextResponse.json(
          { error: "ไม่พบผู้ใช้" },
          { status: 404 }
        );
      }

      // Update admin password and clear reset token
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          password: hashedPassword,
          isFirstLogin: false,
          mustChangePassword: false,
          // resetToken: null,
          // resetTokenExpiry: null,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: "PASSWORD_RESET_COMPLETED",
          entity: "Admin",
          entityId: admin.id,
          adminId: admin.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "รีเซ็ตรหัสผ่านสำเร็จ",
      });
    } else {
      // TODO: In production, validate token and find user by reset token
      // For development, we'll skip token validation
      // const user = await prisma.user.findFirst({
      //   where: {
      //     resetToken: token,
      //     resetTokenExpiry: { gt: new Date() },
      //     isActive: true,
      //   },
      // });
      
      // if (!user) {
      //   return NextResponse.json(
      //     { error: "Token ไม่ถูกต้องหรือหมดอายุ" },
      //     { status: 400 }
      //   );
      // }

      // For development - find first active user (REMOVE IN PRODUCTION)
      const user = await prisma.user.findFirst({
        where: { isActive: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: "ไม่พบผู้ใช้" },
          { status: 404 }
        );
      }

      // Update user password and clear reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          isFirstLogin: false,
          mustChangePassword: false,
          // resetToken: null,
          // resetTokenExpiry: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: "รีเซ็ตรหัสผ่านสำเร็จ",
      });
    }
  } catch (error) {
    console.error("Reset password confirm error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน" },
      { status: 500 }
    );
  }
}
