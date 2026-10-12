import { randomBytes } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export const UPLOAD_DIR = fileURLToPath(new URL('../uploads', import.meta.url));
export const UPLOAD_URL_PREFIX = '/api/uploads';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export class UploadError extends Error {}

/** Saves a base64 `data:image/...` URL under uploads/<folder>/ and returns its public URL. */
export async function saveDataUrlImage(dataUrl: unknown, folder: string, baseName: string) {
  if (typeof dataUrl !== 'string') throw new UploadError('Image is required');
  const match = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  const ext = match ? EXTENSIONS[match[1]] : undefined;
  if (!match || !ext) throw new UploadError('Use a JPG, PNG or WebP image');

  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length === 0) throw new UploadError('Image is empty');
  if (bytes.length > MAX_IMAGE_BYTES) throw new UploadError('Image must be 5 MB or smaller');

  const dir = path.join(UPLOAD_DIR, folder);
  await mkdir(dir, { recursive: true });
  const fileName = `${baseName}-${Date.now()}-${randomBytes(3).toString('hex')}.${ext}`;
  await writeFile(path.join(dir, fileName), bytes);
  return `${UPLOAD_URL_PREFIX}/${folder}/${fileName}`;
}

/** Removes a file previously returned by `saveDataUrlImage`; ignores external URLs. */
export async function deleteUpload(url: unknown) {
  if (typeof url !== 'string' || !url.startsWith(`${UPLOAD_URL_PREFIX}/`)) return;
  const file = path.resolve(UPLOAD_DIR, url.slice(UPLOAD_URL_PREFIX.length + 1));
  if (!file.startsWith(UPLOAD_DIR + path.sep)) return;
  await unlink(file).catch(() => {});
}
