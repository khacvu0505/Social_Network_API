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
