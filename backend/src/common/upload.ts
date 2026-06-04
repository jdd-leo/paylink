import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import { extname, resolve } from 'path';
import { randomBytes } from 'crypto';
import { put } from '@vercel/blob';

// Mantido apenas para servir as logos antigas versionadas em /uploads (ServeStatic).
export const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR ?? 'uploads');
const ALLOWED = /\.(png|jpe?g|webp|gif)$/i;

// Buffer em memória: o disco do Render é efêmero, então enviamos ao Vercel Blob.
export const imageStorage = memoryStorage();

export function imageFileFilter(
  _req: unknown,
  file: { originalname: string },
  cb: (error: Error | null, accept: boolean) => void,
) {
  if (!ALLOWED.test(file.originalname)) {
    return cb(new BadRequestException('Formato de imagem inválido'), false);
  }
  cb(null, true);
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Envia o arquivo ao Vercel Blob e retorna a URL pública definitiva. */
export async function uploadImage(file: Express.Multer.File): Promise<string> {
  const key = randomBytes(16).toString('hex') + extname(file.originalname).toLowerCase();
  const blob = await put(key, file.buffer, {
    access: 'public',
    contentType: file.mimetype,
    addRandomSuffix: false,
  });
  return blob.url;
}
