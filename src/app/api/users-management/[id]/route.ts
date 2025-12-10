import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        identity: true,
        firstName: true,
        lastName: true,
        title: true,
        email: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        claims: {
          include: {
            welfareSubType: {
              select: {
                name: true,
                welfareType: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const data = await request.json();
    const {
      identity,
      firstName,
      lastName,
      title,
      email,
      phone,
      password,
      isActive,
    } = data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check for conflicts with other users
    if (identity || email) {
      const conflictUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                { identity: identity || undefined },
                { email: email || undefined },
              ],
            },
          ],
        },
      });

      if (conflictUser) {
        return NextResponse.json(
          { error: "Another user with this identity or email already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: any = {
      identity,
      firstName,
      lastName,
      title,
      email: email || null,
      phone: phone || null,
      isActive,
    };

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        identity: true,
        firstName: true,
        lastName: true,
        title: true,
        email: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        claims: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has welfare claims
    if (user.claims.length > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete user with existing welfare claims. Please transfer or remove claims first." 
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}