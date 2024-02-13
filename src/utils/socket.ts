import { ObjectId } from 'mongodb';
import { Server as ServerHttp, createServer } from 'http';
import { ErrorWithStatus } from '~/models/Error';
import { USERS_MESSAGES } from '~/constants/messages';
import HTTP_STATUS from '~/constants/httpStatus';
import { verifyToken } from './jwt';
import { TokenPayload } from '~/models/requests/User.requests';
import { UserVerifyStatus } from '~/constants/enum';
import { verifyAccessToken } from './common';
import databaseService from '~/services/database.services';
import Conversation from '~/models/schemas/Conversation.schema';
import { Server } from 'socket.io';

export const initSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    /* options */
    cors: {
      origin: 'http://localhost:3000',
      credentials: true
    }
  });

  const users: {
    [key: string]: {
      socket_id: string;
    };
  } = {};

  io.use((socket, next) => {
    const { Authorization } = socket.handshake.auth as { Authorization: string };
    const access_token = Authorization ? Authorization.split(' ')[1] : '';

    try {
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
      const { verify } = decoded as TokenPayload;
      if (verify !== UserVerifyStatus.Verified) {
        throw new ErrorWithStatus({
          message: USERS_MESSAGES.USER_NOT_VERIFY,
          status: HTTP_STATUS.FORBIDDEN
        });
      }
      // Truyền decoded_authorization vào socket để sd ở các middlewares khác
      socket.handshake.auth.decoded_authorization = decoded;
      socket.handshake.auth.access_token = access_token;

      next();
    } catch (error) {
      next({
        message: 'Invalid token',
        name: 'Unauthorized',
        data: error
      });
    }
  });
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    const user_id = socket.handshake.auth.decoded_authorization.user_id as string;
    users[user_id] = {
      socket_id: socket.id
    };

    socket.use(([event, ...args], next) => {
      // do something with the packet (logging, authorization, rate limiting...)
      // do not forget to call next() at the end
      const { access_token } = socket.handshake.auth;
      try {
        verifyAccessToken(access_token);
        next();
      } catch (error) {
        next(new Error('Unauthorized'));
      }
    });

    socket.on('error', (err) => {
      if (err && err.message === 'Unauthorized') {
        socket.disconnect();
      }
    });

    socket.on('private message', (data) => {
      const receiver_socket_id = users[data.to]?.socket_id;

      databaseService.conversations.insertOne(
        new Conversation({
          sender_id: new ObjectId(data.from),
          receiver_id: new ObjectId(data.to),
          content: data.content
        })
      );
      if (!receiver_socket_id) return;

      socket.to(receiver_socket_id).emit('receive private message', {
        content: data.content,
        from: user_id
      });
    });

    socket.on('disconnect', () => {
      delete users[user_id];
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};
