import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { TweetType } from '~/constants/enum';
import HTTP_STATUS from '~/constants/httpStatus';
import { TWEETS_MESSAGE } from '~/constants/messages';
import { Pagination, TweetParam, TweetQuery, TweetRequestBody } from '~/models/requests/Tweet.requests';
import { TokenPayload } from '~/models/requests/User.requests';
import Tweet from '~/models/schemas/Tweet.schema';
import tweetsService from '~/services/tweets.services';

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const result = await tweetsService.createTweer(req.body, user_id);
  return res.status(HTTP_STATUS.CREATED).json({
    message: TWEETS_MESSAGE.CREATE_TWEET_SUCCESS,
    result
  });
};

export const getTweetController = async (req: Request, res: Response) => {
  const result = await tweetsService.increaseTweetViews(
    req.params.tweet_id.toString(),
    req.decoded_authorization?.user_id
  );

  const tweet = {
    ...req.tweet,
    user_views: result.user_views,
    guest_views: result.guest_views,
    updated_at: result.updated_at
  };

  return res.status(HTTP_STATUS.OK).json({
    message: TWEETS_MESSAGE.GET_TWEET_SUCCESS,
    result: tweet
  });
};

export const getTweetChildrenController = async (req: Request<TweetParam, any, any, TweetQuery>, res: Response) => {
  const user_id = req.decoded_authorization?.user_id;

  const result = await tweetsService.getTweetChildren({
    tweet_id: req.params.tweet_id.toString(),
    limit: req.query.limit ? Number(req.query.limit) : 10,
    page: req.query.page ? Number(req.query.page) : 1,
    tweet_type: Number(req.query.tweet_type as string) as TweetType,
    user_id
  });

  return res.status(HTTP_STATUS.OK).json({
    message: TWEETS_MESSAGE.GET_TWEET_SUCCESS,
    result
  });
};

export const getNewFeedsController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response) => {
  const user_id = req.decoded_authorization?.user_id as string;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const result = await tweetsService.getNewFeeds({
    user_id,
    page,
    limit
  });
  return res.json({
    message: TWEETS_MESSAGE.GET_NEW_FEEDS_SUCCESS,
    result
  });
};
