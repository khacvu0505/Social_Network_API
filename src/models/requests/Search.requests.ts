import { Query } from 'express-serve-static-core';
import { MediaTypeQuery, PeopleFollow } from '~/constants/enum';
import { Pagination } from './Tweet.requests';

export interface SearchQuery extends Pagination, Query {
  content: string;
  media_type?: MediaTypeQuery;
  // Search tweet từ người mà ta follow và mọi người
  people_follow?: PeopleFollow; // 1: search people you follow, false: search all people(people don't follow)
}
