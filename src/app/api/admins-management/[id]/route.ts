import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const admin = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isActive: true,
        isFirstLogin: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ admin });
  } catch (error) {
    console.error("Error fetching admin:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const data = await request.json();
    const { username, email, name, password, role, isActive } = data;

    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!existingAdmin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    // Prevent modifying own PRIMARY role
    if (existingAdmin.role === "PRIMARY" && 
        session?.user?.id === id && 
        role !== "PRIMARY") {
      return NextResponse.json(
        { error: "Cannot change your own PRIMARY role" },
        { status: 400 }
      );
    }

    // Check for conflicts with other admins
    if (username || email) {
      const conflictAdmin = await prisma.admin.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                { username: username || undefined },
                { email: email || undefined },
              ],
            },
          ],
        },
      });

      if (conflictAdmin) {
        return NextResponse.json(
          { error: "Another admin with this username or email already exists" },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      username,
      email: email || null,
      name: name || null,
      role,
      isActive,
    };

    // Hash new password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
      updateData.mustChangePassword = false;
    }

    const admin = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ admin });
  } catch (error) {
    console.error("Error updating admin:", error);
    return NextResponse.json(
      { error: "Failed to update admin" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      );
    }

    // Prevent deleting self
    if (session?.user?.id === id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Prevent deleting PRIMARY admin
    if (admin.role === "PRIMARY") {
      return NextResponse.json(
        { error: "Cannot delete PRIMARY admin" },
        { status: 400 }
      );
    }

    await prisma.admin.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json(
      { error: "Failed to delete admin" },
      { status: 500 }
    );
  }
}
