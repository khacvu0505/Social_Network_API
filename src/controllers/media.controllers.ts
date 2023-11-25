import { NextFunction, Request, Response } from 'express';
import HTTP_STATUS from '~/constants/httpStatus';
import mediaService from '~/services/media.services';

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediaService.handleUploadSingleImage(req);
  return res.status(HTTP_STATUS.OK).json({
    result
  });
};
