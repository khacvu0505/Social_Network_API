import { NextFunction, Request, Response } from 'express';
import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';
import mediaService from '~/services/media.services';
import path from 'path';
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir';
import fs from 'fs';
import mime from 'mime';

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
  const url = await mediaService.uploadImage(req);
  return res.status(HTTP_STATUS.OK).json({
    url,
    message: USERS_MESSAGES.UPLOAD_IMAGE_SUCCESS
  });
};

export const serveImageController = async (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.params;
  return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, name), (err) => {
    return res.status((err as any)?.status as any).send('Not found');
  });
};

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediaService.uploadVideo(req);
  return res.status(HTTP_STATUS.OK).json({
    result,
    message: USERS_MESSAGES.UPLOAD_VIDEO_SUCCESS
  });
};

export const serveVideoStreamController = async (req: Request<{ name: string }>, res: Response, next: NextFunction) => {
  const range = req.headers.range;
  if (!range) {
    return res.status(HTTP_STATUS.BAD_REQUEST).send('Requires Range header');
  }
  const { name } = req.params;
  const videoPath = path.resolve(UPLOAD_VIDEO_DIR, name);

  // Dung lượng của video
  const videoSize = fs.statSync(videoPath).size;

  const parts = range.replace(/bytes=/, '').split('-');

  // Lấy giá trị byte bắt đầu từ header range
  const start = parseInt(parts[0], 10);

  // Lấy giá trị byte kết thúc từ header range
  const end = parts[1] ? parseInt(parts[1], 10) : videoSize - 1;

  // Dung lượng của mỗi phân đoạn stream
  const chunkSize = end - start + 1;

  const file = fs.createReadStream(videoPath, { start, end });
  const headers = {
    'Content-Range': `bytes ${start}-${end}/${videoSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': mime.getType(videoPath) || 'video/*' // library mime để lấy ra định dạng của file vd mime.getType('video.mp4') => 'video/mp4' || mime.getType('example.html') => text/html
  };
  fs.createReadStream(videoPath, { start, end });

  res.writeHead(HTTP_STATUS.PARTIAL_CONTENT, headers);
  file.pipe(res);
};
