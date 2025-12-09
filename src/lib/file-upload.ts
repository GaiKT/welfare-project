import { getSupabaseAdmin } from "./supabase";

/**
 * File Upload Utilities
 * Helper functions for handling file uploads to Supabase Storage
 */

export interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

// Supabase Storage bucket name
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate file type
 */
export function validateFileType(fileType: string): boolean {
  return ALLOWED_FILE_TYPES.includes(fileType);
}

/**
 * Validate file size
 */
export function validateFileSize(fileSize: number): boolean {
  return fileSize <= MAX_FILE_SIZE;
}

/**
 * Upload a single file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  subfolder: string = "claims"
): Promise<UploadedFile> {
  // Validate file type
  if (!validateFileType(file.type)) {
    throw new Error(
      `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`
    );
  }

  // Validate file size
  if (!validateFileSize(file.size)) {
    throw new Error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  const supabaseAdmin = getSupabaseAdmin();

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const fileExtension = file.name.split(".").pop();
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .substring(0, 50);
  const fileName = `${timestamp}-${randomString}-${sanitizedName}`;
  const filePath = `${subfolder}/${fileName}`;

  // Convert file to buffer for upload
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Supabase storage upload error:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL for the uploaded file
  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return {
    fileName,
    fileUrl: urlData.publicUrl,
    fileType: file.type,
    fileSize: file.size,
  };
}

/**
 * Upload multiple files to Supabase Storage
 */
export async function uploadMultipleFiles(
  files: File[],
  subfolder: string = "claims"
): Promise<UploadedFile[]> {
  const uploadPromises = files.map((file) => uploadFile(file, subfolder));
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Extract the file path from the URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split("/storage/v1/object/public/");
    
    if (pathParts.length < 2) {
      console.warn("Invalid Supabase storage URL:", fileUrl);
      return;
    }

    // Get bucket and file path
    const fullPath = pathParts[1];
    const [bucket, ...filePathParts] = fullPath.split("/");
    const filePath = filePathParts.join("/");

    if (!bucket || !filePath) {
      console.warn("Could not extract bucket or file path from URL:", fileUrl);
      return;
    }

    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error("Supabase storage delete error:", error);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    // Don't throw error, just log it
  }
}

/**
 * Delete multiple files from Supabase Storage
 */
export async function deleteMultipleFiles(fileUrls: string[]): Promise<void> {
  const deletePromises = fileUrls.map((url) => deleteFile(url));
  await Promise.allSettled(deletePromises);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Check if file is an image
 */
export function isImageFile(fileType: string): boolean {
  return fileType.startsWith("image/");
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}
