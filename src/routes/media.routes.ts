import { Router } from 'express';
import { uploadImageController, uploadVideoController } from '~/controllers/media.controllers';
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const mediaRoute = Router();

mediaRoute.post('/upload-image', wrapRequestHandler(uploadImageController));

mediaRoute.post('/upload-video', accessTokenValidator, verifyUserValidator, wrapRequestHandler(uploadVideoController));

export default mediaRoute;
