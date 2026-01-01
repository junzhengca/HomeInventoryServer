import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
    const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || "";
    const B2_S3_ENDPOINT = process.env.B2_S3_ENDPOINT || "";

    if (!B2_S3_ENDPOINT) {
      throw new Error("B2_S3_ENDPOINT is not configured");
    }

    s3Client = new S3Client({
      endpoint: B2_S3_ENDPOINT,
      region: "us-west-000", // B2 default region, can be overridden via env if needed
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true, // Required for B2 S3-compatible API
    });
  }
  return s3Client;
}

export async function uploadFile(
  fileName: string,
  contentType: string,
  data: Buffer
): Promise<void> {
  try {
    const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || "";
    if (!B2_BUCKET_NAME) {
      throw new Error("B2_BUCKET_NAME is not configured");
    }

    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileName,
      Body: data,
      ContentType: contentType,
    });

    const client = getS3Client();
    await client.send(command);
  } catch (error) {
    console.error("B2 upload failed:", error);
    throw new Error("Failed to upload file to B2");
  }
}

export function getPublicUrl(fileName: string): string {
  const bucketName = process.env.B2_BUCKET_NAME || "";
  const B2_S3_ENDPOINT = process.env.B2_S3_ENDPOINT || "";
  
  if (!bucketName) {
    throw new Error("B2_BUCKET_NAME is not configured");
  }
  
  if (!B2_S3_ENDPOINT) {
    throw new Error("B2_S3_ENDPOINT is not configured");
  }

  // Use S3-compatible URL format: https://s3.region.backblazeb2.com/bucket-name/file-name
  // Since we're using forcePathStyle, the URL format is: endpoint/bucket-name/file-name
  return `${B2_S3_ENDPOINT}/${bucketName}/${fileName}`;
}
