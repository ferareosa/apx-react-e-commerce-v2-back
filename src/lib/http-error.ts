export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
