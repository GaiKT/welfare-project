import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { UserType } from "@/types/auth";

/**
 * POST /api/auth/upload-signature
 * Upload digital signature (PNG) for Admin/Manager
 * Only ADMIN, MANAGER, and PRIMARY roles can upload signatures
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

    // Only admins can upload signatures
    if (session.user.userType !== UserType.ADMIN) {
      return NextResponse.json(
        { error: "Only administrators can upload signatures" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("signature") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 2MB" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "signatures");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const userId = session.user.id;
    const fileExtension = file.name.split(".").pop();
    const fileName = `signature-${userId}-${timestamp}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Update admin signature URL in database
    const signatureUrl = `/uploads/signatures/${fileName}`;
    await prisma.admin.update({
      where: { id: userId },
      data: {
        signatureUrl,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "SIGNATURE_UPLOADED",
        entity: "Admin",
        entityId: userId,
        adminId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Signature uploaded successfully",
      signatureUrl,
    });
  } catch (error) {
    console.error("Upload signature error:", error);
    return NextResponse.json(
      { error: "Failed to upload signature" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/upload-signature
 * Remove signature for current admin
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.userType !== UserType.ADMIN) {
      return NextResponse.json(
        { error: "Only administrators can manage signatures" },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Update admin signature URL in database
    await prisma.admin.update({
      where: { id: userId },
      data: {
        signatureUrl: null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "SIGNATURE_REMOVED",
        entity: "Admin",
        entityId: userId,
        adminId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Signature removed successfully",
    });
  } catch (error) {
    console.error("Remove signature error:", error);
    return NextResponse.json(
      { error: "Failed to remove signature" },
      { status: 500 }
    );
  }
}
