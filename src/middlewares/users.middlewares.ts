import e, { NextFunction, Request, Response } from 'express';
import { ParamSchema, checkSchema } from 'express-validator';
import { USERS_MESSAGES } from '~/constants/messages';
import databaseService from '~/services/database.services';
import usersService from '~/services/users.services';
import { hasPassword } from '~/utils/crypto';
import { validate } from '~/utils/validation';
import { JsonWebTokenError } from 'jsonwebtoken';
import { verifyToken } from '~/utils/jwt';
import { ErrorWithStatus } from '~/models/Error';
import HTTP_STATUS from '~/constants/httpStatus';
import capitalize from 'lodash/capitalize';
import { ObjectId } from 'mongodb';
import { TokenPayload } from '~/models/requests/User.requests';
import { UserVerifyStatus } from '~/constants/enum';
import { REGEX_USERNAME } from '~/constants/regex';

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USERS_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGES.PASSWORD_MUST_BE_STRONG
  },
  trim: true
};

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isLength: {
    options: {
      min: 6,
      max: 50
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
  },
  isStrongPassword: {
    options: {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minSymbols: 1
    },
    errorMessage: USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  trim: true,
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USERS_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD);
      }
      return true;
    }
  }
};

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        });
      }
      try {
        const decoded = verifyToken({
          token: value,
          secretKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string
        });
        const user = await databaseService.users.findOne({ _id: new ObjectId(decoded.user_id) });
        // Case user not found
        if (!user) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.BAD_REQUEST
          });
        }
        // Check value user input is not the same with value in database
        if (value !== user.forgot_password_token) {
          throw new ErrorWithStatus({
            message: USERS_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_INVALID,
            status: HTTP_STATUS.BAD_REQUEST
          });
        }

        (req as Request).decoded_forgot_password_token = decoded;
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: capitalize((error as JsonWebTokenError).message),
            status: HTTP_STATUS.UNAUTHORIZED
          });
        }

        throw error;
      }
      return true;
    }
  }
};

const nameSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.NAME_IS_REQUIRED
  },
  isString: {
    errorMessage: USERS_MESSAGES.NAME_MUST_BE_A_STRING
  },
  trim: true,
  isLength: { options: { min: 1, max: 100 }, errorMessage: USERS_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100 }
};

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: {
      strict: true,
      strictSeparator: true
    },
    errorMessage: USERS_MESSAGES.DATE_OF_BIRTH_MUST_BE_ISO8601
  }
};

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_A_STRING
  },
  trim: true,
  isLength: { options: { min: 1, max: 400 }, errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH }
};

const userIdSchema: ParamSchema = {
  custom: {
    options: async (value, { req }) => {
      if (!ObjectId.isValid(value)) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.INVALID_USER_ID,
          status: HTTP_STATUS.BAD_REQUEST
        });
      }
      const user_id = await databaseService.users.findOne({ _id: new ObjectId(value) });
      if (!user_id) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_FOUND,
          status: HTTP_STATUS.NOT_FOUND
        });
      }
      return true;
    }
  }
};
// ==================== Validators ====================

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        trim: true,
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hasPassword(req.body.password)
            });
            if (!user) {
              throw new Error(USERS_MESSAGES.EMAIL_OR_PASSWORD_INCORRECT);
            }
            req.user = user;
            return true;
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
);

export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        trim: true,
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        custom: {
          options: async (value, { req, location, path }) => {
            const isExistEmail = await usersService.checkEmailExists(value);
            if (isExistEmail) {
              throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS);
            }
            return true;
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: dateOfBirthSchema
    },
    ['body']
  )
);

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        trim: true,
        custom: {
          options: (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }
            try {
              const access_token = value.split(' ')[1];
              if (!access_token) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }
              const decoded = verifyToken({
                token: access_token,
                secretKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
              });

              (req as Request).decoded_authorization = decoded;
              return true;
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }
          }
        }
      }
    },
    ['headers']
  )
);

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }
            try {
              const decoded = verifyToken({ token: value, secretKey: process.env.JWT_SECRET_REFRESH_TOKEN as string });

              const refresh_token = await databaseService.refreshTokens.findOne({ token: value });

              if (!refresh_token) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USED_REFRESH_TOKEN_DOES_NOT_EXIST,
                  status: HTTP_STATUS.BAD_REQUEST
                });
              }
              (req as Request).decoded_refresh_token = decoded;
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize((error as JsonWebTokenError).message),
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }

              throw error;
            }
            return true;
          }
        }
      }
    },
    ['body']
  )
);

export const verifyEmailTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }
            try {
              const decoded = verifyToken({
                token: value,
                secretKey: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string
              });
              const user = await databaseService.users.findOne({
                _id: new ObjectId(decoded.user_id)
              });

              // User not found
              if (!user) {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.USER_NOT_FOUND,
                  status: HTTP_STATUS.BAD_REQUEST
                });
              }

              // This case is email is verified
              // email_verify_token: '' || jwt(value is '': Email is verified)
              if (user.email_verify_token === '') {
                throw new ErrorWithStatus({
                  message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE,
                  status: HTTP_STATUS.BAD_REQUEST
                });
              }

              (req as Request).decoded_email_verify_token = decoded;
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize((error as JsonWebTokenError).message),
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }

              throw error;
            }
            return true;
          }
        }
      }
    },
    ['body']
  )
);

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USERS_MESSAGES.EMAIL_IS_INVALID
        },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            const user = await databaseService.users.findOne({ email: value });
            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.BAD_REQUEST
              });
            }
            req.user = user;
          }
        }
      }
    },
    ['body']
  )
);

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
);

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
);

// Verify base on authorization_decoded
export const verifyUserValidator = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload;
  if (verify !== UserVerifyStatus.Verified) {
    return next(
      new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_VERIFY,
        status: HTTP_STATUS.FORBIDDEN
      })
    );
  }
  return next();
};

export const updateMeValidator = validate(
  checkSchema(
    {
      name: {
        ...nameSchema,
        optional: true,
        notEmpty: undefined
      },
      date_of_birth: {
        ...dateOfBirthSchema,
        optional: true
      },
      bio: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.BIO_MUST_BE_A_STRING
        },
        trim: true,
        isLength: { options: { min: 1, max: 200 }, errorMessage: USERS_MESSAGES.BIO_LENGTH }
      },
      location: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.LOCATION_MUST_BE_A_STRING
        },
        trim: true,

        isLength: { options: { min: 1, max: 200 }, errorMessage: USERS_MESSAGES.LOCATION_LENGTH }
      },
      website: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.WEBSITE_MUST_BE_A_STRING
        },
        trim: true,
        isLength: { options: { min: 1, max: 400 }, errorMessage: USERS_MESSAGES.WEBSITE__LENGTH }
      },
      username: {
        optional: true,
        isString: {
          errorMessage: USERS_MESSAGES.USER_NAME_MUST_BE_A_STRING
        },
        isLength: { options: { min: 1, max: 50 }, errorMessage: USERS_MESSAGES.USER_NAME_LENGTH },
        custom: {
          options: async (value, { req }) => {
            if (!REGEX_USERNAME.test(value)) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NAME_INVALID,
                status: HTTP_STATUS.BAD_REQUEST
              });
            }
            const username = await databaseService.users.findOne({ username: value });
            // Cho nay la username da ton tai, khong duoc trung username
            if (username) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NAME_ALREADY_EXISTS,
                status: HTTP_STATUS.BAD_REQUEST
              });
            }
            return true;
          }
        }
      },
      avatar: imageSchema,
      cover_photo: imageSchema
    },
    ['body']
  )
);

export const followValidator = validate(
  checkSchema(
    {
      followed_user_id: userIdSchema
    },
    ['body']
  )
);

export const unFollowValidator = validate(
  checkSchema(
    {
      user_id: userIdSchema
    },
    ['params']
  )
);

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        ...passwordSchema,
        custom: {
          options: async (value, { req }) => {
            const { user_id } = req.decoded_authorization as TokenPayload;
            const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) });
            if (!user) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              });
            }
            const { password } = user;
            const isCorrectPassword = hasPassword(value) === password;
            if (!isCorrectPassword) {
              throw new ErrorWithStatus({
                message: USERS_MESSAGES.OLD_PASSWORD_INCORRECT,
                status: HTTP_STATUS.BAD_REQUEST
              });
            }
            return true;
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
);

export const isUserLoggedInValidator = (middleware: (req: Request, res: Response, next: NextFunction) => void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization) {
      return middleware(req, res, next);
    }
    next();
  };
};
