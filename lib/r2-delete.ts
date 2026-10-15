/**
 * Cloudflare R2 file deletion utilities.
 * Used by all delete handlers to clean up orphaned files.
 */

import { DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { r2, BUCKETS } from './r2';

/**
 * Delete a single file from R2.
 * Silently ignores errors (file may not exist).
 */
export async function deleteR2File(
  bucket: string,
  key: string | null | undefined
): Promise<void> {
  if (!key || !key.trim()) return;

  try {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key.trim(),
      })
    );
  } catch (err) {
    console.warn(`[R2] Failed to delete ${key} from ${bucket}:`, err);
  }
}

/**
 * Delete multiple files from R2 in a single batch request.
 * Filters out null/empty keys automatically.
 * Max 1000 keys per batch (R2 limit).
 */
export async function deleteR2Files(
  bucket: string,
  keys: (string | null | undefined)[]
): Promise<void> {
  const validKeys = keys
    .filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
    .map((k) => k.trim());

  if (validKeys.length === 0) return;

  // R2 supports max 1000 objects per batch delete
  const batches: string[][] = [];
  for (let i = 0; i < validKeys.length; i += 1000) {
    batches.push(validKeys.slice(i, i + 1000));
  }

  for (const batch of batches) {
    try {
      await r2.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: batch.map((Key) => ({ Key })),
            Quiet: true,
          },
        })
      );
    } catch (err) {
      console.warn(`[R2] Batch delete failed for ${batch.length} files in ${bucket}:`, err);
      // Fallback: delete one by one
      for (const key of batch) {
        await deleteR2File(bucket, key);
      }
    }
  }
}