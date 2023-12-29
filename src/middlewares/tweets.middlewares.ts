import { checkSchema } from 'express-validator';
import { isEmpty } from 'lodash';
import { ObjectId } from 'mongodb';
import { MediaType, TweetAudience, TweetType } from '~/constants/enum';
import { TWEETS_MESSAGE } from '~/constants/messages';
import { numberEnumToArray } from '~/utils/common';
import { validate } from '~/utils/validation';

const tweetTypes = numberEnumToArray(TweetType);
const tweerAudiences = numberEnumToArray(TweetAudience);
const mediaTypes = numberEnumToArray(MediaType);

export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetTypes],
        errorMessage: TWEETS_MESSAGE.INVALID_TYPE
      }
    },
    audience: {
      isIn: {
        options: [tweerAudiences],
        errorMessage: TWEETS_MESSAGE.INVALID_AUDIENCE
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type;
          // If `type` is retweet, comment. quotetweet then `parent_id` have to `tweet_id` of parent
          if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            throw new Error(TWEETS_MESSAGE.PARENT_ID_MUST_BE_A_VALID_TWEET_ID);
          }

          // If `type` is tweet then `parent_id` have to be null
          if (type === TweetType.Tweet && value !== null) {
            throw new Error(TWEETS_MESSAGE.PARENT_ID_MUST_BE_NULL);
          }
          return true;
        }
      }
    },
    content: {
      isString: true,
      custom: {
        options: (value, { req }) => {
          const type = req.body.type;
          const hashtags = req.body.hashtags;
          const mentions = req.body.mentions;
          // If `type` is comment, quotetweet, tweet and don't have mentions, hashtags then content must be a string and not empty
          if (
            [TweetType.Retweet, TweetType.Comment, TweetType.Tweet].includes(type) &&
            isEmpty(hashtags) &&
            isEmpty(mentions) &&
            value.trim() === ''
          ) {
            throw new Error(TWEETS_MESSAGE.CONTENT_MUST_BE_A_NON_EMPTY_STRING);
          }

          // if type is retweet then content must be a string empty('')
          if (type === TweetType.Retweet && value !== '') {
            throw new Error(TWEETS_MESSAGE.CONTENT_MUST_BE_EMPTY_STRING);
          }
          return true;
        }
      }
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Each item in arr must be a string
          if (!value.every((item) => typeof item === 'string')) {
            throw new Error(TWEETS_MESSAGE.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING);
          }
          return true;
        }
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Each item in arr must be a user_id
          if (!value.every((item) => ObjectId.isValid(item))) {
            throw new Error(TWEETS_MESSAGE.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID);
          }
          return true;
        }
      }
    },
    medias: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Each item in arr must be a Media Object (Other.ts)
          if (
            value.some((item: any) => {
              return typeof item.url !== 'string' || !mediaTypes.includes(item.type);
            })
          ) {
            throw new Error(TWEETS_MESSAGE.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT);
          }
          return true;
        }
      }
    }
  })
);
