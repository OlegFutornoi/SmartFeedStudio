import { PresignedUploadUrlResult } from '@smartfeed/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface DirectUploadOptions {
  file: File | Blob;
  fileName: string;
  contentType: string;
  accessToken: string;
  folder?: string;
  onProgress?: (percentage: number) => void;
}

/**
 * Requests Presigned URL from Backend CQRS handler, then uploads directly to S3/MinIO.
 */
export async function uploadDirectToS3(
  options: DirectUploadOptions,
): Promise<{ s3Key: string; publicUrl?: string }> {
  const { file, fileName, contentType, accessToken, folder = 'images', onProgress } = options;

  // 1. Request presigned upload URL from NestJS backend
  const presignedRes = await fetch(`${API_BASE_URL}/storage/presigned-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      fileName,
      contentType,
      folder,
    }),
  });

  if (!presignedRes.ok) {
    throw new Error(`Failed to request presigned upload URL: ${presignedRes.statusText}`);
  }

  const { uploadUrl, s3Key, publicUrl }: PresignedUploadUrlResult = await presignedRes.json();

  // 2. Upload file directly to S3 / MinIO via HTTP PUT
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 direct upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error occurred during direct S3 upload'));
    xhr.send(file);
  });

  return { s3Key, publicUrl };
}
