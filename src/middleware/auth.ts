import type { NextFunction, Response } from 'express';
import { authService, userService } from '../container.js';
import { HttpError } from '../lib/http-error.js';
import { getSupabaseClient } from '../lib/supabase.js';
import type { AuthenticatedRequest } from '../types/http.js';

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing or invalid Authorization header');
    }

    const token = header.slice('Bearer '.length).trim();
    try {
      const payload = authService.verifyToken(token);
      const user = await userService.getById(payload.userId);

      req.auth = payload;
      req.user = user;

      next();
      return;
    } catch (error) {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw error instanceof HttpError ? error : new HttpError(401, 'Token inválido');
      }

      const { data, error: supabaseError } = await supabase.auth.getUser(token);
      if (supabaseError || !data.user?.email) {
        throw new HttpError(401, 'Token inválido');
      }

      const ensuredUser = await userService.ensureUser(data.user.email, {
        supabaseId: data.user.id
      });
      req.auth = {
        userId: ensuredUser.id,
        email: ensuredUser.email,
        supabaseUserId: data.user.id
      };
      req.user = ensuredUser;

      next();
    }
  } catch (error) {
    next(error);
  }
}
