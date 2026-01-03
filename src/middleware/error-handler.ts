import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../lib/http-error.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(err);
  }

  const httpError = err instanceof HttpError ? err : undefined;
  const validationError = err instanceof ZodError ? err : undefined;

  const statusCode = httpError ? httpError.statusCode : validationError ? 400 : 500;

  const payload: Record<string, unknown> = {
    message:
      httpError?.message ?? validationError?.message ?? (err instanceof Error ? err.message : 'Unexpected server error')
  };

  if (httpError?.metadata) {
    payload.metadata = httpError.metadata;
  }

  if (validationError) {
    payload.issues = validationError.issues;
  }

  if (!httpError && !validationError) {
    console.error('[server] unexpected error', err);
  }

  res.status(statusCode).json(payload);
}
