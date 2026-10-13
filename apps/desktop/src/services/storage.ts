import {
  PresignedUrlResponseDto,
  StorageQuotaDto,
  StorageFileDto,
  StorageFileListResponseDto,
  StorageFileListQueryDto,
  ConfirmUploadRequestDto,
  StorageFileCategory,
  CleanupOrphansRequestDto,
  CleanupOrphansResponseDto,
} from '@smartfeed/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface DirectUploadOptions {
  file: File | Blob;
  fileName: string;
  contentType: string;
  accessToken: string;
  folder?: string;
  onProgress?: (percentage: number) => void;
}

export interface DirectUploadResult {
  s3Key: string;
  publicUrl?: string;
  storageFile?: StorageFileDto;
}

let inFlightQuotaPromise: Promise<StorageQuotaDto> | null = null;
let lastQuotaToken: string | null = null;
let lastQuotaTime = 0;
let cachedQuota: StorageQuotaDto | null = null;

/**
 * Explicitly invalidate in-memory storage quota cache across all components.
 */
export function invalidateStorageQuotaCache(): void {
  cachedQuota = null;
  lastQuotaTime = 0;
  lastQuotaToken = null;
}

/**
 * Fetch current user's Cloudflare R2 / S3 storage quota metrics with in-flight deduplication.
 */
export async function getStorageQuota(
  accessToken: string,
  force = false,
): Promise<StorageQuotaDto> {
  if (force) {
    invalidateStorageQuotaCache();
  }

  const now = Date.now();
  if (!force && cachedQuota && lastQuotaToken === accessToken && now - lastQuotaTime < 1000) {
    return cachedQuota;
  }
  if (!force && inFlightQuotaPromise && lastQuotaToken === accessToken) {
    return inFlightQuotaPromise;
  }

  lastQuotaToken = accessToken;
  inFlightQuotaPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/storage/quota`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch storage quota: ${res.statusText}`);
      }

      const data = await res.json();
      cachedQuota = data;
      lastQuotaTime = Date.now();
      return data;
    } finally {
      inFlightQuotaPromise = null;
    }
  })();

  return inFlightQuotaPromise;
}

/**
 * Confirm uploaded file to register it in PostgreSQL and update storage quota.
 */
export async function confirmStorageUpload(
  accessToken: string,
  dto: ConfirmUploadRequestDto,
): Promise<StorageFileDto> {
  const res = await fetch(`${API_BASE_URL}/storage/confirm-upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `Failed to confirm upload: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Delete a file from Cloudflare R2 storage and reclaim quota.
 */
export async function deleteStorageFile(
  accessToken: string,
  fileId: string,
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE_URL}/storage/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to delete storage file: ${res.statusText}`);
  }

  invalidateStorageQuotaCache();
  return res.json();
}

/**
 * Fetch paginated list of uploaded files in Cloudflare R2.
 */
export async function getStorageFiles(
  accessToken: string,
  query?: StorageFileListQueryDto,
): Promise<StorageFileListResponseDto> {
  const params = new URLSearchParams();
  if (query?.page) params.append('page', String(query.page));
  if (query?.limit) params.append('limit', String(query.limit));
  if (query?.folder) params.append('folder', query.folder);
  if (query?.search) params.append('search', query.search);

  const url = `${API_BASE_URL}/storage/files${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch storage files: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Requests Presigned URL from Backend CQRS handler, then uploads directly to Cloudflare R2 / S3.
 */
export async function uploadDirectToS3(options: DirectUploadOptions): Promise<DirectUploadResult> {
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
    const errorBody = await presignedRes.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Failed to request presigned upload URL: ${presignedRes.statusText}`,
    );
  }

  const { uploadUrl, s3Key, publicUrl }: PresignedUrlResponseDto = await presignedRes.json();

  // 2. Upload file directly to S3 / Cloudflare R2 via HTTP PUT
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
        reject(new Error(`Direct storage upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error occurred during direct storage upload'));
    xhr.send(file);
  });

  // 3. Confirm upload to register file in PostgreSQL and update storage quota
  let storageFile: StorageFileDto | undefined;
  try {
    const category =
      folder === 'snapshots'
        ? StorageFileCategory.SYSTEM_BACKUP
        : folder === 'catalogs'
          ? StorageFileCategory.FEED_CATALOG
          : folder === 'exports'
            ? StorageFileCategory.EXPORT_ARCHIVE
            : StorageFileCategory.PRODUCT_IMAGE;

    storageFile = await confirmStorageUpload(accessToken, {
      s3Key,
      category,
      originalName: fileName,
    });
  } catch (confirmErr) {
    console.warn(
      '[uploadDirectToS3] Warning: S3 PUT succeeded but confirmStorageUpload failed:',
      confirmErr,
    );
  }

  return { s3Key, publicUrl, storageFile };
}

/**
 * Scans S3 bucket for orphaned unindexed files and purges garbage.
 */
export async function cleanupStorageOrphans(
  accessToken: string,
  dto?: CleanupOrphansRequestDto,
): Promise<CleanupOrphansResponseDto> {
  const res = await fetch(`${API_BASE_URL}/storage/cleanup-orphans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(dto || {}),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || `Failed to cleanup storage orphans: ${res.statusText}`);
  }

  if (dto && dto.dryRun === false) {
    invalidateStorageQuotaCache();
  }

  return res.json();
}
