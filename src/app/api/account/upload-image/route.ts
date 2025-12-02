import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UserType } from "@/types/auth";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const imageType = formData.get("type") as string; // "profile" or "signature"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!imageType || !["profile", "signature"].includes(imageType)) {
      return NextResponse.json(
        { error: "Invalid image type. Must be 'profile' or 'signature'" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "ไฟล์ต้องเป็นรูปภาพ (JPEG, PNG, GIF, WebP)" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "ขนาดไฟล์ต้องไม่เกิน 5MB" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const subfolder = imageType === "profile" ? "profiles" : "signatures";
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", subfolder);
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${userId}-${timestamp}-${randomString}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${subfolder}/${fileName}`;

    // Delete old image if exists
    let oldImageUrl: string | null = null;
    
    if (session.user.userType === UserType.ADMIN) {
      const admin = await prisma.admin.findUnique({
        where: { id: userId },
        select: { image: true, signatureUrl: true },
      });
      oldImageUrl = imageType === "profile" ? admin?.image ?? null : admin?.signatureUrl ?? null;
    }
    // Note: Regular users don't have image/signature fields in the current schema

    // Delete old file if exists
    if (oldImageUrl) {
      try {
        const oldFilePath = join(process.cwd(), "public", oldImageUrl);
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath);
        }
      } catch {
        // Ignore error if file doesn't exist
      }
    }

    // Update database
    if (session.user.userType === UserType.ADMIN) {
      await prisma.admin.update({
        where: { id: userId },
        data: imageType === "profile" 
          ? { image: fileUrl, updatedAt: new Date() }
          : { signatureUrl: fileUrl, updatedAt: new Date() },
      });
    }
    // Note: If you need to support image upload for regular users, 
    // you'll need to add image/signatureUrl fields to the User model

    return NextResponse.json(
      { 
        message: "Upload successful",
        fileUrl,
        imageType
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Upload image error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove profile or signature image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageType = searchParams.get("type");

    if (!imageType || !["profile", "signature"].includes(imageType)) {
      return NextResponse.json(
        { error: "Invalid image type. Must be 'profile' or 'signature'" },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    let imageUrl: string | null = null;

    if (session.user.userType === UserType.ADMIN) {
      const admin = await prisma.admin.findUnique({
        where: { id: userId },
        select: { image: true, signatureUrl: true },
      });
      imageUrl = imageType === "profile" ? admin?.image ?? null : admin?.signatureUrl ?? null;
    }

    // Delete file if exists
    if (imageUrl) {
      try {
        const filePath = join(process.cwd(), "public", imageUrl);
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch {
        // Ignore error if file doesn't exist
      }

      // Update database
      if (session.user.userType === UserType.ADMIN) {
        await prisma.admin.update({
          where: { id: userId },
          data: imageType === "profile"
            ? { image: null, updatedAt: new Date() }
            : { signatureUrl: null, updatedAt: new Date() },
        });
      }
    }

    return NextResponse.json(
      { message: "Image deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
