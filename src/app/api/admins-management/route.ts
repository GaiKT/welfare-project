import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await requireSuperAdmin();

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        image: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const data = await request.json();
    const { username, email, name, password, role } = data;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [
          { username },
          { email: email || undefined },
        ],
      },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin with this username or email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.admin.create({
      data: {
        username,
        email: email || null,
        name: name || null,
        password: hashedPassword,
        role: role || "ADMIN",
        isActive: true,
        isFirstLogin: true,
        mustChangePassword: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 }
    );
  }
}
