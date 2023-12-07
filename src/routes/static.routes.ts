import { Router } from 'express';
import { serveImageController, serveVideoStreamController } from '~/controllers/media.controllers';
const staticRoute = Router();

staticRoute.get('/image/:name', serveImageController);

staticRoute.get('/video-stream/:name', serveVideoStreamController);

export default staticRoute;
