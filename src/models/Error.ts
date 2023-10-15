import HTTP_STATUS from '~/constants/httpStatus';
import { USERS_MESSAGES } from '~/constants/messages';

// Define Record<string,string> trong ts => {[key:string]: string}
// Define Record<string,{message:string}> trong ts => {[key:string]: {message:string}}

type ErrorsType = Record<
  string,
  {
    msg: string;
    [key: string]: any;
  }
>;
export class ErrorWithStatus {
  message: string;
  status: number;
  constructor({ message, status }: { message: string; status: number }) {
    this.message = message;
    this.status = status;
  }
}

// Use for status 422
export class EntityError extends ErrorWithStatus {
  errors: ErrorsType;
  constructor({ errors }: { errors: ErrorsType }) {
    super({ message: USERS_MESSAGES.VALIDATION_ERROR, status: HTTP_STATUS.UNPROCESSABLE_ENTITY });
    this.errors = errors;
  }
}
