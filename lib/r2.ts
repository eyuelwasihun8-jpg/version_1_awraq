import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

/** Short-lived download/stream URL (default 10 min) */
export async function getDownloadUrl(
  bucket: string,
  key: string,
  expiresIn = 600
) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(r2, command, { expiresIn });
}

/** Short-lived upload URL for receipts (default 10 min) */
export async function getUploadUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn = 600
) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2, command, { expiresIn });
}

export const BUCKETS = {
  content: process.env.R2_BUCKET_CONTENT!,
  receipts: process.env.R2_BUCKET_RECEIPTS!,
  certificates: process.env.R2_BUCKET_CERTIFICATES!,
} as const;