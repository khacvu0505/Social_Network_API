import { Request, Response, NextFunction } from 'express';
import { checkSchema } from 'express-validator';
import usersService from '~/services/users.services';
import { validate } from '~/utils/validation';
export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;
  console.log('data', username, password);
  next();
};

export const registerValidator = validate(
  checkSchema({
    name: {
      isLength: { options: { min: 1, max: 100 } },
      notEmpty: true,
      trim: true,
      isString: true
    },
    email: {
      notEmpty: true,
      trim: true,
      isEmail: true,
      custom: {
        options: async (value, { req, location, path }) => {
          const isExistEmail = await usersService.checkEmailExists(value);
          if (isExistEmail) {
            throw new Error('Email already exists');
          }
          return true;
        },
        errorMessage: 'Email already exists'
      }
    },
    password: {
      notEmpty: true,
      trim: true,
      isLength: {
        options: {
          min: 6,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minSymbols: 1
        },
        errorMessage:
          'Please must be at least 6 characters long and contain at least one lowercase letter, 1 uppercase letter, 1 number and 1 symbol'
      }
    },
    confirm_password: {
      trim: true,
      isLength: {
        options: {
          min: 6,
          max: 50
        }
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minSymbols: 1
        },
        errorMessage:
          'Please must be at least 6 characters long and contain at least one lowercase letter, 1 uppercase letter, 1 number and 1 symbol'
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Password confirm does not match with Password');
          }
          return true;
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        }
      }
    }
  })
);
