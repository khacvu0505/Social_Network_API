import { NextFunction, Request, Response } from 'express';
import path from 'path';
import formidable, { File } from 'formidable';
import isEmpty from 'lodash/isEmpty';
import { UPLOAD_TEMP_DIR } from '~/constants/dir';

export const handleUploadSingleImage = (req: Request) => {
  const uploadDir = path.resolve(UPLOAD_TEMP_DIR);
  const form = formidable({
    maxFiles: 1,
    maxFileSize: 300 * 1024, // 300kb
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

  return new Promise<File>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      if (isEmpty(files)) {
        return reject(new Error('File is required'));
      }
      return resolve((files.image as File[])[0]);
    });
  });
};

export const getNameFromFullName = (fullName: string) => {
  const fullNameArr = fullName.split('.');
  return fullNameArr[0];
};
