import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { UserType } from "@/types/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

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

    const supabaseAdmin = getSupabaseAdmin();
    const userId = session.user.id;
    const subfolder = imageType === "profile" ? "profiles" : "signatures";

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${userId}-${timestamp}-${randomString}.${fileExtension}`;
    const filePath = `${subfolder}/${fileName}`;

    // Convert file to buffer and upload to Supabase
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    const fileUrl = urlData.publicUrl;

    // Delete old image from Supabase if exists
    let oldImageUrl: string | null = null;
    
    if (session.user.userType === UserType.ADMIN) {
      const admin = await prisma.admin.findUnique({
        where: { id: userId },
        select: { image: true, signatureUrl: true },
      });
      oldImageUrl = imageType === "profile" ? admin?.image ?? null : admin?.signatureUrl ?? null;
    } else {
      // User type
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
      });
      oldImageUrl = imageType === "profile" ? user?.image ?? null : null;
    }

    // Delete old file from Supabase if exists
    if (oldImageUrl && oldImageUrl.includes("supabase")) {
      try {
        const url = new URL(oldImageUrl);
        const pathParts = url.pathname.split("/storage/v1/object/public/");
        if (pathParts.length >= 2) {
          const fullPath = pathParts[1];
          const [bucket, ...filePathParts] = fullPath.split("/");
          const oldFilePath = filePathParts.join("/");
          if (bucket && oldFilePath) {
            await supabaseAdmin.storage.from(bucket).remove([oldFilePath]);
          }
        }
      } catch {
        // Ignore error if file doesn't exist or URL is invalid
      }
    }

    // Update database
    if (session.user.userType === UserType.ADMIN) {
      // Check if admin exists first
      const adminExists = await prisma.admin.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      
      if (adminExists) {
        await prisma.admin.update({
          where: { id: userId },
          data: imageType === "profile" 
            ? { image: fileUrl, updatedAt: new Date() }
            : { signatureUrl: fileUrl, updatedAt: new Date() },
        });
      } else {
        console.error("Admin not found with id:", userId);
        return NextResponse.json(
          { error: "Admin record not found" },
          { status: 404 }
        );
      }
    } else {
      // User type - only support profile image
      if (imageType === "profile") {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        
        if (userExists) {
          await prisma.user.update({
            where: { id: userId },
            data: { image: fileUrl, updatedAt: new Date() },
          });
        } else {
          console.error("User not found with id:", userId);
          return NextResponse.json(
            { error: "User record not found" },
            { status: 404 }
          );
        }
      }
    }

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

    const supabaseAdmin = getSupabaseAdmin();
    const userId = session.user.id;
    let imageUrl: string | null = null;

    if (session.user.userType === UserType.ADMIN) {
      const admin = await prisma.admin.findUnique({
        where: { id: userId },
        select: { image: true, signatureUrl: true },
      });
      imageUrl = imageType === "profile" ? admin?.image ?? null : admin?.signatureUrl ?? null;
    } else {
      // User type
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
      });
      imageUrl = imageType === "profile" ? user?.image ?? null : null;
    }

    // Delete file from Supabase if exists
    if (imageUrl && imageUrl.includes("supabase")) {
      try {
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split("/storage/v1/object/public/");
        if (pathParts.length >= 2) {
          const fullPath = pathParts[1];
          const [bucket, ...filePathParts] = fullPath.split("/");
          const filePath = filePathParts.join("/");
          if (bucket && filePath) {
            await supabaseAdmin.storage.from(bucket).remove([filePath]);
          }
        }
      } catch {
        // Ignore error if file doesn't exist or URL is invalid
      }

      // Update database
      if (session.user.userType === UserType.ADMIN) {
        await prisma.admin.update({
          where: { id: userId },
          data: imageType === "profile"
            ? { image: null, updatedAt: new Date() }
            : { signatureUrl: null, updatedAt: new Date() },
        });
      } else {
        // User type - only support profile image
        if (imageType === "profile") {
          await prisma.user.update({
            where: { id: userId },
            data: { image: null, updatedAt: new Date() },
          });
        }
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
