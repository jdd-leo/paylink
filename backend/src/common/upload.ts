import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';
const ALLOWED = /\.(png|jpe?g|webp|gif)$/i;

export const imageStorage = diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const name = randomBytes(16).toString('hex') + extname(file.originalname).toLowerCase();
    cb(null, name);
  },
});

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
