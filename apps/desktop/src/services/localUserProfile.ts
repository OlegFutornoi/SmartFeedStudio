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
 */
export async function optimizeAvatarImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }

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
        // Export as WebP if supported, fallback to JPEG
        try {
          const dataUrl = canvas.toDataURL('image/webp', 0.85);
          resolve(dataUrl);
        } catch {
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
