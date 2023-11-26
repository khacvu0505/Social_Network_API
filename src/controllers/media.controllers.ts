import { NextFunction, Request, Response } from 'express';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import mediaService from '~/services/media.services';
import path from 'path';
import { UPLOAD_DIR } from '~/constants/dir';

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaService.handleUploadSingleImage(req);
  return res.status(HTTP_STATUS.OK).json({
    url,
    message: USERS_MESSAGES.UPLOAD_IMAGE_SUCCESS
  });
};

export const serveImageController = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;
  return res.sendFile(path.resolve(UPLOAD_DIR, name), (err) => {
    return res.status((err as any)?.status as any).send('Not found');
  });
};
