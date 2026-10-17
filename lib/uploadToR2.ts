/**
 * Universal fast upload helper.
 * - Auto-compresses images in the browser.
 * - Requests a presigned R2 URL from the server.
 * - Uploads the file DIRECTLY to Cloudflare R2 (bypasses Next.js server).
 * - Reports progress via callback.
 */

import { compressImage } from './compressImage';

export interface UploadOptions {
  folder: string;
  onProgress?: (percent: number) => void;
  endpoint?:
    | '/api/admin/upload-url'
    | '/api/admin/upload-file'
    | '/api/upload-url'
    | '/api/payment/upload-url'
    | '/api/payment/upload'
    | '/api/profile/avatar-upload';
  compress?: boolean;
  maxImageWidth?: number;
  imageQuality?: number;
  serverUpload?: boolean;
}

export interface UploadResult {
  fileKey: string;
  size: number;
  contentType: string;
}

export async function uploadToR2(
  rawFile: File,
  options: UploadOptions
): Promise<UploadResult> {
  const {
    folder,
    onProgress,
    endpoint = '/api/admin/upload-url',
    compress = true,
    maxImageWidth = 1600,
    imageQuality = 0.75,
    serverUpload = false,
  } = options;

  if (!rawFile) {
    throw new Error('No file provided');
  }

  let uploadBlob: Blob = rawFile;
  let filename = rawFile.name || 'file.bin';
  let contentType = rawFile.type || 'application/octet-stream';

  if (compress && rawFile.type.startsWith('image/')) {
    try {
      const compressed = await compressImage(rawFile, maxImageWidth, imageQuality);
      if (compressed instanceof Blob && compressed.size > 0) {
        uploadBlob = compressed;
        contentType = 'image/jpeg';
        filename = filename.replace(/\.[^/.]+$/, '') + '.jpg';
      }
    } catch (err) {
      console.warn('[uploadToR2] Compression failed, uploading original:', err);
    }
  }

  onProgress?.(5);

  if (serverUpload) {
    const formData = new FormData();
    formData.append('file', uploadBlob, filename);
    formData.append('folder', folder);

    const { fileKey } = await new Promise<{ fileKey: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const pct = 5 + Math.round((event.loaded / event.total) * 94);
          onProgress(Math.min(pct, 99));
        }
      };

      xhr.onload = () => {
        let response: { fileKey?: string; error?: string };
        try {
          response = JSON.parse(xhr.responseText);
        } catch {
          reject(new Error('Upload server returned an invalid response'));
          return;
        }

        if (xhr.status < 200 || xhr.status >= 300 || !response.fileKey) {
          reject(new Error(response.error || 'Failed to upload file'));
          return;
        }

        resolve({ fileKey: response.fileKey });
      };
      xhr.onerror = () => reject(new Error('Network error during server upload'));
      xhr.ontimeout = () => reject(new Error('Upload timed out'));
      xhr.timeout = 5 * 60 * 1000;
      xhr.send(formData);
    });

    onProgress?.(100);
    return { fileKey, size: uploadBlob.size, contentType };
  }

  const urlRes = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentType,
      folder,
      filename,
      size: uploadBlob.size,
    }),
  });

  const urlData = await urlRes.json().catch(() => ({}));
  if (!urlRes.ok || !urlData.uploadUrl || !urlData.fileKey) {
    throw new Error(urlData.error || 'Failed to prepare upload');
  }

  const { uploadUrl, fileKey } = urlData as { uploadUrl: string; fileKey: string };

  onProgress?.(15);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const pct = 15 + Math.round((event.loaded / event.total) * 84);
        onProgress(Math.min(pct, 99));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };
    xhr.onerror = () =>
      reject(
        new Error(
          'The browser could not complete the Cloudflare R2 upload. This can be caused by a blocked CORS preflight, a network interruption, or an expired/invalid upload URL. Confirm the latest app deployment is live, then inspect the failed OPTIONS and PUT requests in Developer Tools > Network.'
        )
      );
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.timeout = 5 * 60 * 1000;

    xhr.send(uploadBlob);
  });

  onProgress?.(100);

  return {
    fileKey,
    size: uploadBlob.size,
    contentType,
  };
}