import { checkSchema } from 'express-validator';
import { MediaTypeQuery, PeopleFollow } from '~/constants/enum';
import { SEARCH_MESSAGE } from '~/constants/messages';
import { validate } from '~/utils/validation';

export const searchvalidator = validate(
  checkSchema(
    {
      content: {
        isString: {
          errorMessage: SEARCH_MESSAGE.CONTENT_MUST_BE_A_STRING
        }
      },
      media_type: {
        optional: true,
        isIn: {
          options: [Object.values(MediaTypeQuery)],
          errorMessage: SEARCH_MESSAGE.MEDIA_TYPE_IS_NOT_VALID
        }
      },
      people_follow: {
        optional: true,
        isIn: {
          options: [Object.values(PeopleFollow)],
          errorMessage: SEARCH_MESSAGE.PEOPLE_FOLLOW_MUST_BE_0_OR_1
        }
      }
    },
    ['query']
  )
);
