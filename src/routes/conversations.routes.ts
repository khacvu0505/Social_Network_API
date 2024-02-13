import { Router } from 'express';
import { getConversationsController } from '~/controllers/conversation.controller';
import { paginationValidator } from '~/middlewares/tweets.middlewares';
import { accessTokenValidator, getConversationValidator, verifyUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';

const conversationRouter = Router();

conversationRouter.get(
  '/receivers/:receiver_id',
  getConversationValidator,
  accessTokenValidator,
  verifyUserValidator,
  paginationValidator,
  wrapRequestHandler(getConversationsController)
);

export default conversationRouter;
