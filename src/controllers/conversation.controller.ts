import { ParamsDictionary } from 'express-serve-static-core';
import { Request, Response } from 'express';
import conversationService from '~/services/conversation.services';
import { ConversationsRequestParams } from '~/models/requests/Conversation.requests';

export const getConversationsController = async (req: Request<ConversationsRequestParams>, res: Response) => {
  const sender_id = req.decoded_authorization?.user_id as string;
  const { receiver_id } = req.params;
  const limit = Number(req.query.limit);
  const page = Number(req.query.page);

  const result = await conversationService.getConversations({
    receiver_id,
    sender_id,
    limit,
    page
  });
  return res.status(200).json({
    message: 'Get conversation successfully',
    result: {
      total_page: Math.ceil(result.total / limit),
      conversations: result.conversations,
      limit,
      page
    }
  });
};
