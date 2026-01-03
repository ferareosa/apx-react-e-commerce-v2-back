import type { Request } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import type { AuthTokenPayload } from '../services/auth-service.js';
import type { User } from '../services/database.js';

export type AuthenticatedRequest<
  TBody = unknown,
  TQuery extends ParsedQs = ParsedQs
> = Request<ParamsDictionary, unknown, TBody, TQuery> & {
  auth?: AuthTokenPayload;
  user?: User;
};
