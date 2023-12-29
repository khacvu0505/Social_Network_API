import { Router } from 'express';
import { bookmarkTweetController } from '~/controllers/bookmarks.controller';
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const bookmarkRouter = Router();

/**
 * Description: Bookmark a tweet
 * Path: /
 * Method: POST
 * Body: {twitch_id: string}
 * Header: {Authorizzation: Bearer <access_token>}
 */
bookmarkRouter.post('/', accessTokenValidator, verifyUserValidator, wrapRequestHandler(bookmarkTweetController));

export default bookmarkRouter;
