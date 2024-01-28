import { ParamsDictionary } from 'express-serve-static-core';
import { Request, Response } from 'express';
import { SearchQuery } from '~/models/requests/Search.requests';
import searchService from '~/services/search.services';

export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
  const user_id = req.decoded_authorization.user_id as string;
  const { page, limit, content, media_type, people_follow } = req.query;

  const result = await searchService.search({
    content,
    limit,
    page,
    user_id,
    media_type,
    people_follow
  });

  return res.json({
    message: 'Search successfully',
    result
  });
};
