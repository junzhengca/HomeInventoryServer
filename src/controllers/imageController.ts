import { Response } from "express";
import sharp from "sharp";
import crypto from "crypto";
import { uploadFile, getPublicUrl } from "../services/b2";
import { generateSecureFileName } from "../middleware/upload";
import { AuthRequest } from "../types";

interface ImageRequest extends AuthRequest {
  file?: Express.Multer.File;
}

interface Base64RequestBody {
  image: string;
}

function detectMimeType(base64: string): string {
  // Check if it has a data URI prefix
  const match = base64.match(/^data:image\/(\w+);base64,/);
  if (match) {
    const type = match[1];
    return type === "jpg" ? "image/jpeg" : `image/${type}`;
  }

  // Try to detect from the base64 header
  // JPEG: FF D8 FF
  if (base64.startsWith("/9j/")) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47
  if (base64.startsWith("iVBORw0KGgo")) {
    return "image/png";
  }

  // Default to jpeg
  return "image/jpeg";
}

function extractBase64Data(base64: string): string {
  // Remove data URI prefix if present
  return base64.replace(/^data:image\/\w+;base64,/, "");
}

async function processImage(
  buffer: Buffer,
  mimeType: string,
  resizeParam?: string
): Promise<Buffer> {
  // Resize if parameter provided
  if (resizeParam) {
    const width = parseInt(resizeParam, 10);

    if (isNaN(width) || width <= 0 || width > 10000) {
      throw new Error("Invalid resize parameter. Must be a number between 1 and 10000");
    }

    // Resize to specified width, preserving aspect ratio
    return await sharp(buffer)
      .resize(width, null, {
        withoutEnlargement: true,
      })
      .toBuffer();
  }

  return buffer;
}

export async function uploadImage(req: ImageRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const resizeParam = req.query.resize as string | undefined;
    let imageBuffer: Buffer;
    let mimeType: string;
    let fileName: string;

    // Handle base64 upload (JSON body)
    if (req.body && typeof req.body === "object" && "image" in req.body) {
      const { image } = req.body as Base64RequestBody;

      if (!image || typeof image !== "string") {
        res.status(400).json({ message: "Invalid base64 image data" });
        return;
      }

      mimeType = detectMimeType(image);
      const base64Data = extractBase64Data(image);
      imageBuffer = Buffer.from(base64Data, "base64");

      // Validate it's actually an image
      const metadata = await sharp(imageBuffer).metadata();
      if (!metadata.format || (
        metadata.format !== "jpeg" &&
        metadata.format !== "png" &&
        metadata.format !== "webp"
      )) {
        res.status(400).json({ message: "Only PNG and JPG images are allowed" });
        return;
      }

      // Determine file extension
      const ext = metadata.format === "jpeg" ? "jpg" : metadata.format;
      fileName = `${crypto.randomBytes(16).toString("hex")}.${ext}`;

    } else if (req.file) {
      // Handle multipart file upload
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
      fileName = generateSecureFileName(req.file.originalname);

    } else {
      res.status(400).json({ message: "No image provided" });
      return;
    }

    // Process image (resize if needed)
    const processedBuffer = await processImage(imageBuffer, mimeType, resizeParam);

    // Upload to B2
    await uploadFile(fileName, mimeType, processedBuffer);

    // Get public URL
    const publicUrl = getPublicUrl(fileName);

    res.json({
      url: publicUrl,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ message: "Failed to upload image" });
  }
}
