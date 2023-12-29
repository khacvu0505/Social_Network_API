import { Router } from 'express';
import { createTweetController } from '~/controllers/tweets.controllers';
import { createTweetValidator } from '~/middlewares/tweets.middlewares';
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const tweetRouter = Router();

/**
 * Description: Create a new tweet
 * Path: /
 * Method: POST
 * Body: TweetRequestBody
 * Header: {Authorizzation: Bearer <access_token>}
 */
tweetRouter.post(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  createTweetValidator,
  wrapRequestHandler(createTweetController)
);

export default tweetRouter;
