import { ParamsDictionary, Query } from 'express-serve-static-core';
import { TweetAudience, TweetType } from '~/constants/enum';
import { Media } from '../Other';

export interface TweetRequestBody {
  type: TweetType;
  audience: TweetAudience;
  content: string;
  parent_id: null | string; // chỉ null khi tweet gốc, không thì tweet_id cha dạng string
  hashtags: string[];
  mentions: string[]; // user_id[]
  medias: Media[];
}

export interface TweetParam extends ParamsDictionary {
  tweet_id: string;
}

export interface Pagination {
  page: string;
  limit: string;
}

export interface TweetQuery extends Query, Pagination {
  tweet_type: string;
}
