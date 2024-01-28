import { Router } from 'express';
import { searchController } from '~/controllers/search.controllers';
import { searchvalidator } from '~/middlewares/search.middlewares';
import { paginationValidator } from '~/middlewares/tweets.middlewares';
import { accessTokenValidator, verifyUserValidator } from '~/middlewares/users.middlewares';
import { wrapRequestHandler } from '~/utils/handlers';
const searchRouter = Router();

searchRouter.get(
  '/',
  accessTokenValidator,
  verifyUserValidator,
  paginationValidator,
  searchvalidator,
  wrapRequestHandler(searchController)
);

export default searchRouter;
