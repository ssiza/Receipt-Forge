export function serializeError(err: unknown) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      cause: err.cause && (err.cause as any).message ? {
        name: (err.cause as any).name,
        message: (err.cause as any).message,
        stack: (err.cause as any).stack,
      } : undefined,
    };
  }
  try { return { nonError: JSON.parse(JSON.stringify(err)) }; } catch { return { nonError: String(err) }; }
}

export class HttpError extends Error {
  status: number; body?: string;
  constructor(status: number, statusText: string, body?: string) {
    super(`${status} ${statusText}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }
} 