import { ParamsDictionary } from 'express-serve-static-core';
export interface BookmarkTweetRequestBody {
  tweet_id: string;
}

export interface UnBookmarkRequestParams extends ParamsDictionary {
  tweet_id: string;
}
