import { NextFunction, Request, Response } from 'express';
import path from 'path';
import formidable, { File } from 'formidable';
import isEmpty from 'lodash/isEmpty';
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir';
import fs from 'fs';

export const initFolder = () => {
  [UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

export const handleUploadImage = (req: Request) => {
  const uploadDir = path.resolve(UPLOAD_VIDEO_DIR);
  const form = formidable({
    maxFiles: 4,
    maxFileSize: 300 * 1024, // 300kb =  300 * 1024
    maxTotalFileSize: 4 * 300 * 1024, // 300kb =  300 * 1024
    uploadDir,
    keepExtensions: true,
    filter: function ({ name, originalFilename, mimetype }) {
      // keep only images
      const valid = mimetype && mimetype.includes('image');
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any); // optional make form.parse error
      }
      return Boolean(valid);
    }
  });

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      if (isEmpty(files)) {
        return reject(new Error('File is required'));
      }
      return resolve(files.image as File[]);
    });
  });
};

export const getNameFromFullName = (fullName: string) => {
  const fullNameArr = fullName.split('.');
  return fullNameArr[0];
};

export const getExtension = (fullName: string) => {
  const fullNameArr = fullName.split('.');
  return fullNameArr[1];
};

export const handleUploadVideo = (req: Request) => {
  const uploadDir = path.resolve(UPLOAD_VIDEO_DIR);
  const form = formidable({
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    uploadDir,
    filter: function ({ name, originalFilename, mimetype }) {
      // keep only videos
      const valid = mimetype && mimetype.includes('video');
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any); // optional make form.parse error
      }
      return Boolean(valid);
    }
  });

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      if (isEmpty(files)) {
        return reject(new Error('File is required'));
      }
      const videos = files.video as File[];
      videos.forEach((video) => {
        const extensionName = getExtension(video.originalFilename as string);

        fs.renameSync(video.filepath as string, video.filepath + '.' + extensionName);
        video.newFilename += '.' + extensionName;
      });
      return resolve(files.video as File[]);
    });
  });
};
