import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import HTTP_STATUS from '~/constants/httpStatus';
import { BOOKMARK_MESSAGE } from '~/constants/messages';
import { BookmarkTweetRequestBody } from '~/models/requests/Bookmark.requests';
import { TokenPayload } from '~/models/requests/User.requests';
import bookmarkService from '~/services/bookmark.services';
export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload;
  const { tweet_id } = req.body;
  const result = await bookmarkService.createBookmark(tweet_id, user_id);
  return res.status(HTTP_STATUS.CREATED).json({
    message: BOOKMARK_MESSAGE.BOOKMARK_TWEET_SUCCESS,
    result
  });
};
