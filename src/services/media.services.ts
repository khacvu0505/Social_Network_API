import { Request } from 'express';
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/files';
import sharp from 'sharp';
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir';
import path from 'node:path';
import { MediaType } from '~/constants/enum';
import { Media } from '~/models/Other';
import { uploadFileToS3 } from '~/utils/s3';
import mime from 'mime';
import fsPromise from 'fs/promises';
import { CompleteMultipartUploadCommandOutput } from '@aws-sdk/client-s3';
import { isProduction } from '~/constants/config';

class MediaService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req);
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file?.newFilename);
        const newFullFileName = `${newName}.jpg`;
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, `${newFullFileName}`);
        // Convert img to jpg(downgrade size img) and save img with new path
        await sharp(file?.filepath).jpeg().toFile(newPath);

        // Upload img to S3
        // const s3Result = await uploadFileToS3({
        //   fileName: 'images/' + newFullFileName,
        //   filePath: newPath,
        //   contentType: mime.getType(newPath) as string // Mime: use to return type of file base on Path such as 'image/jpeg', 'video/mp4'
        // });

        // await Promise.all([
        //   // Delete path file temp
        //   fsPromise.unlink(file?.filepath),
        //   // Delete path file after upload to S3
        //   fsPromise.unlink(newPath)
        // ]);

        // return {
        //   url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
        //   type: MediaType.Image
        // };

        return {
          url: isProduction
            ? `${process.env.HOST}/static/image/${newFullFileName}`
            : `http://localhost:${process.env.PORT}/static/image/${newFullFileName}`,
          type: MediaType.Image
        };
      })
    );
    return result;
  }

  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req);

    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newPath = path.resolve(UPLOAD_VIDEO_DIR, `${file.newFilename}`);

        const s3Result = await uploadFileToS3({
          fileName: 'videos/' + file.newFilename,
          filePath: `${newPath}`,
          contentType: mime.getType(newPath) as string // Mime: use to return type of file base on Path such as 'image/jpeg', 'video/mp4'
        });
        fsPromise.unlink(newPath as string);
        return {
          url: (s3Result as CompleteMultipartUploadCommandOutput).Location as string,
          type: MediaType.Video
        };

        // return {
        //   url: isProduction
        //     ? `${process.env.HOST}/static/video/${file.newFilename}`
        //     : `http://localhost:${process.env.PORT}/static/video/${file.newFilename}`,
        //   type: MediaType.Video
        // };
      })
    );
    return result;
  }
}

const mediaService = new MediaService();
export default mediaService;
