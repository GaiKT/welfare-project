import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UserType } from "@/types/auth";

// GET - Get current user profile
export async function GET() {
  try {
    const session = await getCurrentSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = session.user.id;
    let user;

    if (session.user.userType === UserType.ADMIN) {
      user = await prisma.admin.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          image: true,
          role: true,
          signatureUrl: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          identity: true,
          firstName: true,
          lastName: true,
          title: true,
          email: true,
          phone: true,
          image: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user, userType: session.user.userType }, { status: 200 });

  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const userId = session.user.id;
    let updatedUser;

    if (session.user.userType === UserType.ADMIN) {
      const { name, email } = body;
      
      // Check if email is already taken by another admin
      if (email) {
        const existingAdmin = await prisma.admin.findFirst({
          where: {
            email,
            NOT: { id: userId }
          }
        });
        
        if (existingAdmin) {
          return NextResponse.json(
            { error: "อีเมลนี้ถูกใช้งานแล้ว" },
            { status: 400 }
          );
        }
      }

      updatedUser = await prisma.admin.update({
        where: { id: userId },
        data: {
          name: name || undefined,
          email: email || undefined,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          image: true,
          role: true,
          signatureUrl: true,
        },
      });
    } else {
      const { firstName, lastName, email, phone, title } = body;
      
      // Check if email is already taken by another user
      if (email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            NOT: { id: userId }
          }
        });
        
        if (existingUser) {
          return NextResponse.json(
            { error: "อีเมลนี้ถูกใช้งานแล้ว" },
            { status: 400 }
          );
        }
      }

      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          title: title || undefined,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          identity: true,
          firstName: true,
          lastName: true,
          title: true,
          email: true,
          phone: true,
        },
      });
    }

    return NextResponse.json(
      { message: "Profile updated successfully", user: updatedUser },
      { status: 200 }
    );

  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
