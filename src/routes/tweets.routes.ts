import { Router } from 'express';
import {
  createTweetController,
  getNewFeedsController,
  getTweetChildrenController,
  getTweetController
} from '~/controllers/tweets.controllers';
import {
  audienceValidator,
  createTweetValidator,
  geteTweetChildrenValidator,
  paginationValidator,
  tweetIdValidator
} from '~/middlewares/tweets.middlewares';
import { accessTokenValidator, isUserLoggedInValidator, verifyUserValidator } from '~/middlewares/users.middlewares';
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

/**
 * Description: get new feeds
 * Path: /new-feeds
 * Method: get
 * Header: {Authorizzation?: Bearer <access_token>}
 * Query: {limit?: number, page?: number}
 */
tweetRouter.get(
  '/new-feeds',
  paginationValidator,
  accessTokenValidator,
  verifyUserValidator,
  wrapRequestHandler(getNewFeedsController)
);

/**
 * Description: get tweet detail
 * Path: /:tweet_id
 * Method: get
 * Header: {Authorizzation?: Bearer <access_token>}
 */
tweetRouter.get(
  '/:tweet_id',
  tweetIdValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifyUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetController)
);

/**
 * Description: get tweet children(Retweet, Comment, QuoteTweet)
 * Path: /:tweet_id/children
 * Method: get
 * Header: {Authorizzation?: Bearer <access_token>}
 * Query: {limit?: number, page?: number, tweet_type?: TweetType}
 */
tweetRouter.get(
  '/:tweet_id/children',
  tweetIdValidator,
  geteTweetChildrenValidator,
  paginationValidator,
  isUserLoggedInValidator(accessTokenValidator),
  isUserLoggedInValidator(verifyUserValidator),
  audienceValidator,
  wrapRequestHandler(getTweetChildrenController)
);

export default tweetRouter;
