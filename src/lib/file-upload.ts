import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * File Upload Utilities
 * Helper functions for handling file uploads
 */

export interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

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
 * Upload a single file
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

  // Create uploads directory if it doesn't exist
  const uploadsDir = join(process.cwd(), "public", "uploads", subfolder);
  try {
    await mkdir(uploadsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const fileExtension = file.name.split(".").pop();
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .substring(0, 50);
  const fileName = `${timestamp}-${randomString}-${sanitizedName}`;
  const filePath = join(uploadsDir, fileName);

  // Convert file to buffer and save
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(filePath, buffer);

  const fileUrl = `/uploads/${subfolder}/${fileName}`;

  return {
    fileName,
    fileUrl,
    fileType: file.type,
    fileSize: file.size,
  };
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  subfolder: string = "claims"
): Promise<UploadedFile[]> {
  const uploadPromises = files.map((file) => uploadFile(file, subfolder));
  return Promise.all(uploadPromises);
}

/**
 * Delete a file
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const filePath = join(process.cwd(), "public", fileUrl);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  } catch {
    // Don't throw error, just log it
  }
}

/**
 * Delete multiple files
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
