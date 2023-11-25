import { Request } from 'express';
import { getNameFromFullName, handleUploadSingleImage } from '~/utils/files';
import sharp from 'sharp';
import { UPLOAD_DIR } from '~/constants/dir';
import path from 'node:path';
import fs from 'fs';
import { config } from 'dotenv';
import { isProduction } from '~/constants/config';
config();

class MediaService {
  async handleUploadSingleImage(req: Request) {
    const file = await handleUploadSingleImage(req);

    const newName = getNameFromFullName(file?.newFilename);
    const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`);

    await sharp(file?.filepath).jpeg().toFile(newPath);
    fs.unlinkSync(file?.filepath);
    return isProduction
      ? `${process.env.HOST}/uploads/${newName}.jpg`
      : `http://localhost:${process.env.PORT}/uploads/${newName}.jpg`;
  }
}

const mediaService = new MediaService();
export default mediaService;
