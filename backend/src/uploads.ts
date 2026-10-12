import { randomBytes } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import express, { type RequestHandler } from 'express';
import { getStore } from '@netlify/blobs';

// Relative to the working directory (backend/ for the npm scripts): the Netlify
// bundle is CommonJS, where import.meta.url is unavailable.
export const UPLOAD_DIR = path.resolve('uploads');
export const UPLOAD_URL_PREFIX = '/api/uploads';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

let blobUploads = false;

/** Stores uploads in Netlify Blobs instead of UPLOAD_DIR; serverless functions have no persistent disk. */
export function useBlobUploads() {
  blobUploads = true;
}

const blobStore = () => getStore('uploads');

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

  const key = `${folder}/${baseName}-${Date.now()}-${randomBytes(3).toString('hex')}.${ext}`;
  if (blobUploads) {
    await blobStore().set(key, new Blob([bytes]), { metadata: { contentType: match[1] } });
  } else {
    await mkdir(path.join(UPLOAD_DIR, folder), { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, key), bytes);
  }
  return `${UPLOAD_URL_PREFIX}/${key}`;
}

/** Removes a file previously returned by `saveDataUrlImage`; ignores external URLs. */
export async function deleteUpload(url: unknown) {
  if (typeof url !== 'string' || !url.startsWith(`${UPLOAD_URL_PREFIX}/`)) return;
  const key = url.slice(UPLOAD_URL_PREFIX.length + 1);
  if (blobUploads) {
    await blobStore().delete(key).catch(() => {});
    return;
  }
  const file = path.resolve(UPLOAD_DIR, key);
  if (!file.startsWith(UPLOAD_DIR + path.sep)) return;
  await unlink(file).catch(() => {});
}

const serveFromDisk = express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true });

/** Serves files saved by `saveDataUrlImage`; mount at UPLOAD_URL_PREFIX. */
export const serveUploads: RequestHandler = async (req, res, next) => {
  if (!blobUploads) return serveFromDisk(req, res, next);
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  try {
    const entry = await blobStore().getWithMetadata(decodeURIComponent(req.path.slice(1)), {
      type: 'arrayBuffer',
    });
    if (!entry) return res.status(404).json({ error: 'Not found' });
    res.setHeader('Content-Type', String(entry.metadata.contentType || 'application/octet-stream'));
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
    res.send(Buffer.from(entry.data));
  } catch (err) {
    next(err);
  }
};
