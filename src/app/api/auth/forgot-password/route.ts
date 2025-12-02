import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/auth/forgot-password
 * Request password reset - sends reset token/link
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, userType } = body;

    if (!identifier) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลสำหรับรีเซ็ตรหัสผ่าน" },
        { status: 400 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    if (userType === "admin") {
      // Find admin by username or email
      const admin = await prisma.admin.findFirst({
        where: {
          OR: [
            { username: identifier },
            { email: identifier }
          ],
          isActive: true,
        },
      });

      if (!admin) {
        // Don't reveal if user exists or not for security
        return NextResponse.json({
          success: true,
          message: "หากข้อมูลถูกต้อง คุณจะได้รับอีเมลสำหรับรีเซ็ตรหัสผ่าน",
        });
      }

      if (!admin.email) {
        return NextResponse.json(
          { error: "บัญชีนี้ไม่มีอีเมลที่ลงทะเบียนไว้ กรุณาติดต่อผู้ดูแลระบบ" },
          { status: 400 }
        );
      }

      // Store reset token in database
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          // Note: You'll need to add these fields to the Admin model
          // resetToken: resetToken,
          // resetTokenExpiry: resetTokenExpiry,
        },
      });

      // TODO: Send email with reset link
      // For now, we'll just log the token (in production, send email)
      console.log(`Password reset requested for admin: ${admin.email}`);
      console.log(`Reset token: ${resetToken}`);
      console.log(`Reset link: ${process.env.NEXTAUTH_URL}/reset-password-confirm?token=${resetToken}&type=admin`);

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: "PASSWORD_RESET_REQUESTED",
          entity: "Admin",
          entityId: admin.id,
          adminId: admin.id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "หากข้อมูลถูกต้อง คุณจะได้รับอีเมลสำหรับรีเซ็ตรหัสผ่าน",
        // For development only - remove in production
        ...(process.env.NODE_ENV === "development" && {
          debug: {
            token: resetToken,
            resetLink: `${process.env.NEXTAUTH_URL}/reset-password-confirm?token=${resetToken}&type=admin`,
          },
        }),
      });
    } else {
      // Find user by identity or email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { identity: identifier },
            { email: identifier }
          ],
          isActive: true,
        },
      });

      if (!user) {
        // Don't reveal if user exists or not for security
        return NextResponse.json({
          success: true,
          message: "หากข้อมูลถูกต้อง คุณจะได้รับอีเมลสำหรับรีเซ็ตรหัสผ่าน",
        });
      }

      if (!user.email) {
        return NextResponse.json(
          { error: "บัญชีนี้ไม่มีอีเมลที่ลงทะเบียนไว้ กรุณาติดต่อผู้ดูแลระบบ" },
          { status: 400 }
        );
      }

      // Store reset token in database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          // Note: You'll need to add these fields to the User model
          // resetToken: resetToken,
          // resetTokenExpiry: resetTokenExpiry,
        },
      });

      // TODO: Send email with reset link
      console.log(`Password reset requested for user: ${user.email}`);
      console.log(`Reset token: ${resetToken}`);
      console.log(`Reset link: ${process.env.NEXTAUTH_URL}/reset-password-confirm?token=${resetToken}&type=user`);

      return NextResponse.json({
        success: true,
        message: "หากข้อมูลถูกต้อง คุณจะได้รับอีเมลสำหรับรีเซ็ตรหัสผ่าน",
        // For development only - remove in production
        ...(process.env.NODE_ENV === "development" && {
          debug: {
            token: resetToken,
            resetLink: `${process.env.NEXTAUTH_URL}/reset-password-confirm?token=${resetToken}&type=user`,
          },
        }),
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดำเนินการ" },
      { status: 500 }
    );
  }
}
