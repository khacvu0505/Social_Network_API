import { Router } from 'express';
import { bookmarkTweetController, unbookmarkTweetController } from '~/controllers/bookmarks.controller';
import { tweetIdValidator } from '~/middlewares/tweets.middlewares';
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const bookmarkRouter = Router();

/**
 * Description: Bookmark a tweet
 * Path: /
 * Method: POST
 * Body: {twitch_id: string, user_id: string}
 * Header: {Authorizzation: Bearer <access_token>}
 */

bookmarkRouter.post(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapRequestHandler(bookmarkTweetController)
);

/**
 * Description: Un-Bookmark a tweet
 * Path: /tweet/:tweet_id
 * Method: DELETE
 * Header: {Authorizzation: Bearer <access_token>}
 */
bookmarkRouter.delete(
  '/tweet/:tweet_id',
  accessTokenValidator,
  verifyUserValidator,
  tweetIdValidator,
  wrapRequestHandler(unbookmarkTweetController)
);

export default bookmarkRouter;
