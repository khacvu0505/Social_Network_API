import { ParamsDictionary } from 'express-serve-static-core';

export interface ConversationsRequestParams extends ParamsDictionary {
  receiver_id: string;
}
