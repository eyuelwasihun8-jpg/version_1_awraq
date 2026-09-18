export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: Record<string, any>) {
    return new ApiError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized', details?: Record<string, any>) {
    return new ApiError(message, 401, 'UNAUTHORIZED', details);
  }

  static forbidden(message: string = 'Forbidden', details?: Record<string, any>) {
    return new ApiError(message, 403, 'FORBIDDEN', details);
  }

  static notFound(message: string = 'Not found', details?: Record<string, any>) {
    return new ApiError(message, 404, 'NOT_FOUND', details);
  }

  static tooManyRequests(message: string = 'Too many requests', details?: Record<string, any>) {
    return new ApiError(message, 429, 'RATE_LIMITED', details);
  }

  static internal(message: string = 'Internal server error', details?: Record<string, any>) {
    return new ApiError(message, 500, 'INTERNAL_ERROR', details);
  }

  toResponse(): Response {
    return new Response(
      JSON.stringify({
        error: this.message,
        code: this.code,
        ...(this.details && { details: this.details }),
      }),
      {
        status: this.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return error.toResponse();
  }

  if (error instanceof Error) {
    console.error('API Error:', error);
    return ApiError.internal(error.message).toResponse();
  }

  console.error('Unknown API Error:', error);
  return ApiError.internal('An unexpected error occurred').toResponse();
}

// Helper to wrap async route handlers
export function withErrorHandling(
  handler: (request: Request) => Promise<Response>
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (error) {
      return handleApiError(error);
    }
  };
}