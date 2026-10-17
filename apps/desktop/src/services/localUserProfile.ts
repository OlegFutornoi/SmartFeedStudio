/**
 * Local User Profile & Avatar Storage for Desktop Client (Offline-first & Local SQLite/Storage)
 */

const LOCAL_AVATAR_STORAGE_KEY = 'smartfeed_local_avatar_';

export async function getLocalAvatar(userId: string): Promise<string | null> {
  if (!userId) return null;
  try {
    const val = localStorage.getItem(`${LOCAL_AVATAR_STORAGE_KEY}${userId}`);
    if (val === '__REMOVED__') return '';
    return val;
  } catch (err) {
    console.warn('[LocalUserProfile] Failed to load local avatar:', err);
    return null;
  }
}

export async function saveLocalAvatar(userId: string, avatarUrl: string | null): Promise<void> {
  if (!userId) return;
  try {
    if (avatarUrl && avatarUrl.trim() !== '') {
      localStorage.setItem(`${LOCAL_AVATAR_STORAGE_KEY}${userId}`, avatarUrl);
    } else {
      localStorage.setItem(`${LOCAL_AVATAR_STORAGE_KEY}${userId}`, '__REMOVED__');
    }
  } catch (err) {
    console.warn('[LocalUserProfile] Failed to save local avatar:', err);
  }
}

/**
 * Helper to compress and resize an image file into a clean data URI (<256px)
 * SEC-07: Validates magic bytes (JPEG/PNG/WebP) and rejects SVG/HTML
 */
export async function optimizeAvatarImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp'];
  if (ext && !ALLOWED_EXT.includes(ext)) {
    throw new Error('Selected file is not an allowed image format (JPEG, PNG, WebP only)');
  }

  // Magic Bytes Check
  const headerBuffer = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(headerBuffer);
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const isWebp =
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';

  if (!isJpeg && !isPng && !isWebp) {
    throw new Error('INVALID_IMAGE_SIGNATURE: File is not a valid JPEG, PNG, or WebP image');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(reader.result as string);
        }

        ctx.drawImage(img, 0, 0, width, height);
        try {
          const dataUrl = canvas.toDataURL('image/webp', 0.85);
          resolve(dataUrl);
        } catch (err) {
          console.warn('[localUserProfile] WebP canvas export failed, using JPEG:', err);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
