import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/validate-reset-token
 * Validate password reset token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userType } = body;

    if (!token || !userType) {
      return NextResponse.json(
        { error: "Token และประเภทผู้ใช้จำเป็น" },
        { status: 400 }
      );
    }

    // For now, since we haven't added resetToken fields to the schema,
    // we'll return valid for development purposes
    // In production, you should validate the token from database
    
    if (userType === "admin") {
      // TODO: Implement actual token validation
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

      return NextResponse.json({
        valid: true,
        message: "Token ถูกต้อง",
      });
    } else {
      // TODO: Implement actual token validation for users
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

      return NextResponse.json({
        valid: true,
        message: "Token ถูกต้อง",
      });
    }
  } catch (error) {
    console.error("Validate reset token error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตรวจสอบ" },
      { status: 500 }
    );
  }
}
