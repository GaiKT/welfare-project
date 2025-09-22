import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await requireSuperAdmin();

    const users = await prisma.user.findMany({
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
        _count: {
          select: {
            claims: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin();

    const data = await request.json();
    const {
      identity,
      firstName,
      lastName,
      title,
      email,
      phone,
      password,
    } = data;

    // Validate required fields
    if (!identity || !firstName || !lastName || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { identity },
          { email: email || undefined },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this identity or email already exists" },
        { status: 409 }
      );
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.create({
      data: {
        identity,
        firstName,
        lastName,
        title,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        isActive: true,
      },
      select: {
        id: true,
        identity: true,
        firstName: true,
        lastName: true,
        title: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}