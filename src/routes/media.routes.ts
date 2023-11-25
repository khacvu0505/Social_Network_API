import { Router } from 'express';
import { uploadSingleImageController } from '~/controllers/media.controllers';
import { wrapRequestHandler } from '~/utils/handlers';
const mediaRoute = Router();

mediaRoute.post('/upload-image', wrapRequestHandler(uploadSingleImageController));

export default mediaRoute;
