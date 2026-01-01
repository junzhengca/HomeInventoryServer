import multer from "multer";
import crypto from "crypto";
import { RequestHandler } from "express";

// Allowed MIME types
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg"];

// Maximum file size: 25MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter to validate image types
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error("Only PNG and JPG images are allowed"));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Generate a cryptographically secure random filename
export function generateSecureFileName(originalName: string): string {
  const ext = originalName.split(".").pop() || "jpg";
  const randomBytes = crypto.randomBytes(16);
  const randomName = randomBytes.toString("hex");
  return `${randomName}.${ext}`;
}
