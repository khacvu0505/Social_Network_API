import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import HTTP_STATUS from '~/constants/httpStatus';
import { TWEETS_MESSAGE } from '~/constants/messages';
import { TweetRequestBody } from '~/models/requests/Tweet.requests';
import { TokenPayload } from '~/models/requests/User.requests';
import tweetsService from '~/services/tweets.services';

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const result = await tweetsService.createTweer(req.body, user_id);
  return res.status(HTTP_STATUS.CREATED).json({
    message: TWEETS_MESSAGE.CREATE_TWEET_SUCCESS,
    result
  });
};
