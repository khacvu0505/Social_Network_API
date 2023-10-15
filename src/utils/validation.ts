import express from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/src/middlewares/schema';
import HTTP_STATUS from '~/constants/httpStatus';
import { EntityError, ErrorWithStatus } from '~/models/Error';
// can be reused by many routes

// sequential processing, stops running validations chain if the previous one fails.
export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validation.run(req);

    const errors = validationResult(req);

    // If don't have any error => next request
    if (errors.isEmpty()) {
      return next();
    }

    // EntityError: Error from FORM (throw new Error)
    // ErrorWithStatus: Another Error (throw new ErrorWithStatus)

    // Use error.map to return error object instead of error.array() to return array error
    const errorObject = errors.mapped();
    const entityError = new EntityError({ errors: {} });

    for (const key in errorObject) {
      const { msg } = errorObject[key];
      // This issue does not from validation form
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg);
      }
      // Error form (Set [key]:msg to return value)
      entityError.errors[key] = errorObject[key];
    }

    return next(entityError);
  };
};
