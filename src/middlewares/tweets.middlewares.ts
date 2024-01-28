import { Request, Response, NextFunction } from 'express';
import { checkSchema } from 'express-validator';
import { isEmpty } from 'lodash';
import { ObjectId } from 'mongodb';
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enum';
import HTTP_STATUS from '~/constants/httpStatus';
import { TWEETS_MESSAGE, USERS_MESSAGES } from '~/constants/messages';
import { ErrorWithStatus } from '~/models/Error';
import Tweet from '~/models/schemas/Tweet.schema';
import databaseService from '~/services/database.services';
import { numberEnumToArray } from '~/utils/common';
import { wrapRequestHandler } from '~/utils/handlers';
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

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        isMongoId: {
          errorMessage: TWEETS_MESSAGE.INVALID_TWEET_ID
        },
        custom: {
          options: async (value: string, { req }) => {
            const [tweet] = await databaseService.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
                  }
                },
                {
                  $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    as: 'mentions'
                  }
                },
                {
                  $addFields: {
                    mentions: {
                      $map: {
                        input: '$mentions',
                        as: 'mention',
                        in: {
                          _id: '$$mention._id',
                          name: '$$mention.name',
                          username: '$$mention.username',
                          email: '$$mention.email'
                        }
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                  }
                },
                {
                  $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'likes'
                  }
                },
                {
                  $lookup: {
                    from: 'tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweet_children'
                  }
                },
                {
                  $addFields: {
                    bookmarks: {
                      $size: '$bookmarks'
                    },
                    likes: {
                      $size: '$likes'
                    },
                    retweet_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.Retweet]
                          }
                        }
                      }
                    },
                    comment_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.Comment]
                          }
                        }
                      }
                    },
                    quote_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', TweetType.QuoteTweet]
                          }
                        }
                      }
                    }
                  }
                },
                {
                  $project: {
                    tweet_children: 0
                  }
                }
              ])
              .toArray();
            if (!tweet) {
              throw new ErrorWithStatus({
                message: TWEETS_MESSAGE.TWEET_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              });
            }
            // Set value tweet to req.tweet
            (req as Request).tweet = tweet;
            return true;
          }
        }
      }
    },
    ['params', 'body']
  )
);

// Nếu muốn dùng async await trong handle express handler thì phải dùng try catch
// Nếu k dùng try catch chỗ này thì có thể dùng lại function wrapRequestHandler trong utils/handlers.ts
export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet;
  if (tweet.audience === TweetAudience.TwitterCircle) {
    // Kiểm tra người xem đã đăng nhập Tweet này hay chưa
    if (!req.decoded_authorization) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
        status: HTTP_STATUS.UNAUTHORIZED
      });
    }
    // Kiểm tra tài khoản tác giả có bị khóa không
    const author = await databaseService.users.findOne({ _id: tweet.user_id });
    if (!author) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }
    if (author?.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_WAS_BANNED,
        status: HTTP_STATUS.FORBIDDEN
      });
    }

    // Kiểm tra người xem Tweet này có nằm trong Tweet Circle của tác giả hay không
    const { user_id } = req.decoded_authorization;

    const isInTweetCircle = author?.twitter_circle?.some((item: ObjectId) => item.equals(user_id));
    // Nếu bạn không phải là tác giả và không nằm trong Twitter Circle
    if (!isInTweetCircle && !author._id.equals(user_id)) {
      throw new ErrorWithStatus({
        message: TWEETS_MESSAGE.PERMISSION_DENIED,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }
  }
  // In case Audience of Tweet is Every One
  next();
});

export const geteTweetChildrenValidator = validate(
  checkSchema(
    {
      tweet_type: {
        isIn: {
          options: [TweetType],
          errorMessage: TWEETS_MESSAGE.INVALID_TYPE
        }
      }
    },
    ['query']
  )
);

export const paginationValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true,
        custom: {
          options: (value) => {
            const num = Number(value);
            if (num < 1 || num > 100) {
              throw new Error(TWEETS_MESSAGE.LIMIT_MUST_BE_GREATER_THAN_0_AND_LESS_THAN_100);
            }

            return true;
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: (value) => {
            const num = Number(value);
            if (num < 1) {
              throw new Error(TWEETS_MESSAGE.PAGE_MUST_BE_GREATER_THAN_0);
            }
            return true;
          }
        }
      }
    },
    ['query']
  )
);
