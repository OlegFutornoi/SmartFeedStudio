import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function isSafeAvatarPayload(value: unknown): boolean {
  if (value === null || value === undefined || value === '') {
    return true;
  }
  if (typeof value !== 'string') {
    return false;
  }

  const str = value.trim();

  // 1. Data URI validation: data:image/(jpeg|png|webp);base64,<data>
  if (str.startsWith('data:')) {
    const match = str.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      return false; // Reject SVG, HTML, text, or malformed data URIs
    }

    const mimeSubtype = match[1];
    const base64Data = match[2];

    try {
      const buffer = Buffer.from(base64Data.slice(0, 32), 'base64');
      if (buffer.length < 4) return false;

      // Magic bytes verification
      if (mimeSubtype === 'jpeg') {
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      }
      if (mimeSubtype === 'png') {
        return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      }
      if (mimeSubtype === 'webp') {
        if (buffer.length < 12) return false;
        const riff = buffer.toString('ascii', 0, 4);
        const webp = buffer.toString('ascii', 8, 12);
        return riff === 'RIFF' && webp === 'WEBP';
      }
      return false;
    } catch {
      return false;
    }
  }

  // 2. HTTPS URL validation
  if (str.startsWith('https://')) {
    try {
      const url = new URL(str);
      if (url.username || url.password) return false;
      const lowerPath = url.pathname.toLowerCase();
      const isImageExt = /\.(jpe?g|png|webp)$/i.test(lowerPath);
      const isKnownAvatarService =
        url.hostname.includes('unavatar.io') ||
        url.hostname.includes('google.com') ||
        url.hostname.includes('gravatar.com') ||
        url.hostname.includes('githubusercontent.com') ||
        url.hostname.includes('r2.smartfeed.studio') ||
        url.hostname.includes('cdn.smartfeed.studio') ||
        url.hostname.includes('cloudflare.com');

      return isImageExt || isKnownAvatarService;
    } catch {
      return false;
    }
  }

  return false;
}

export function IsValidAvatar(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidAvatar',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message:
          'Avatar must be a valid JPEG, PNG, or WebP image (Data URI with verified magic bytes or HTTPS image URL). SVG and scripts are prohibited.',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return isSafeAvatarPayload(value);
        },
      },
    });
  };
}
