/**
 * API Handler Wrapper
 * Provides consistent error handling, validation, and response formatting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';
import { ApiError, handleApiError } from './errors';
import { getClientIp } from './turnstile';
import { rateLimit } from './rate-limit';
import { requireAuth, requireStaff, requireAdmin, requireSuperAdmin } from './auth';

// ============================================
// Types
// ============================================

export interface ValidatedRequest<T> extends NextRequest {
  validatedData: T;
  validatedQuery: Record<string, any>;
  clientIp: string;
  auth?: any;
}

export type RouteHandler<T = any> = (
  request: ValidatedRequest<T>
) => Promise<NextResponse<any>>;

export type GetHandler = (
  request: ValidatedRequest<any>,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse<any>>;

// ============================================
// Error Response Helpers
// ============================================

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  status = 400,
  code = 'BAD_REQUEST',
  details?: Record<string, any>
): NextResponse {
  return NextResponse.json(
    { success: false, error: message, code, details },
    { status }
  );
}

// ============================================
// Validation Helpers
// ============================================

export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.flatten().fieldErrors;
      throw ApiError.badRequest('Validation failed', { validation: details });
    }
    throw ApiError.badRequest('Invalid JSON body');
  }
}

export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): T {
  try {
    const query = Object.fromEntries(request.nextUrl.searchParams);
    return schema.parse(query);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.flatten().fieldErrors;
      throw ApiError.badRequest('Invalid query parameters', { validation: details });
    }
    throw ApiError.badRequest('Invalid query parameters');
  }
}

export async function validateRequest<TBody, TQuery>(
  request: NextRequest,
  bodySchema: ZodSchema<TBody> | null,
  querySchema: ZodSchema<TQuery> | null
): Promise<{ body: TBody | null; query: TQuery | null }> {
  const body = bodySchema ? await validateBody(request, bodySchema) : null;
  const query = querySchema ? validateQuery(request, querySchema) : null;
  return { body, query };
}

// ============================================
// Handler Wrappers
// ============================================

export function createHandler<TBody = any, TQuery = any>(
  bodySchema: ZodSchema<TBody> | null,
  querySchema: ZodSchema<TQuery> | null,
  handler: RouteHandler<TBody>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const clientIp = getClientIp(request) || 'unknown';

    try {
      const { body, query } = await validateRequest(request, bodySchema, querySchema);

      const validatedRequest = request as ValidatedRequest<TBody>;
      validatedRequest.validatedData = body as TBody;
      validatedRequest.validatedQuery = query as Record<string, any>;
      validatedRequest.clientIp = clientIp;

      const response = await handler(validatedRequest);

      const duration = Date.now() - startTime;
      if (duration > 1000) {
        console.warn(`[API Slow] ${request.method} ${request.nextUrl.pathname} took ${duration}ms`);
      }

      return response;
    } catch (error) {
      console.error(`[API Error] ${request.method} ${request.nextUrl.pathname}:`, error);
      return handleApiError(error);
    }
  };
}

export function createGetHandler<TQuery = any>(
  querySchema: ZodSchema<TQuery> | null,
  handler: GetHandler
) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    const clientIp = getClientIp(request) || 'unknown';

    try {
      const params = await context.params;
      const query = querySchema ? validateQuery(request, querySchema) : null;

      const validatedRequest = request as ValidatedRequest<any>;
      validatedRequest.validatedData = null;
      validatedRequest.validatedQuery = { ...query, ...params };
      validatedRequest.clientIp = clientIp;

      const response = await handler(validatedRequest, context);

      const duration = Date.now() - startTime;
      if (duration > 1000) {
        console.warn(`[API Slow] GET ${request.nextUrl.pathname} took ${duration}ms`);
      }

      return response;
    } catch (error) {
      console.error(`[API Error] GET ${request.nextUrl.pathname}:`, error);
      return handleApiError(error);
    }
  };
}

export function createCrudHandlers<TCreate, TUpdate, TQuery>({
  createSchema,
  updateSchema,
  querySchema,
  handlers,
}: {
  createSchema?: ZodSchema<TCreate>;
  updateSchema?: ZodSchema<TUpdate>;
  querySchema?: ZodSchema<TQuery>;
  handlers: {
    GET?: RouteHandler;
    POST?: RouteHandler<TCreate>;
    PATCH?: RouteHandler<TUpdate>;
    PUT?: RouteHandler<TUpdate>;
    DELETE?: RouteHandler;
  };
}) {
  const methodHandlers: Record<string, (req: NextRequest) => Promise<NextResponse>> = {};

  if (handlers.GET) {
    methodHandlers.GET = createHandler(null, querySchema || null, handlers.GET);
  }
  if (handlers.POST) {
    methodHandlers.POST = createHandler(createSchema || null, null, handlers.POST);
  }
  if (handlers.PATCH) {
    methodHandlers.PATCH = createHandler(updateSchema || null, null, handlers.PATCH);
  }
  if (handlers.PUT) {
    methodHandlers.PUT = createHandler(updateSchema || null, null, handlers.PUT);
  }
  if (handlers.DELETE) {
    methodHandlers.DELETE = createHandler(null, null, handlers.DELETE);
  }

  return methodHandlers;
}

// ============================================
// Rate Limit Integration
// ============================================

export interface RateLimitConfig {
  max: number;
  windowMs: number;
  keyPrefix?: string;
}

export function withRateLimit(
  handler: RouteHandler,
  config: RateLimitConfig
): RouteHandler {
  return async (request) => {
    const key = `${config.keyPrefix || 'api'}:${request.clientIp}`;
    const rl = await rateLimit(key, config.max, config.windowMs);

    if (!rl.allowed) {
      return errorResponse(
        'Too many requests. Please try again later.',
        429,
        'RATE_LIMITED',
        { retryAfter: rl.retryAfter }
      );
    }

    const response = await handler(request);

    response.headers.set('X-RateLimit-Limit', String(config.max));
    response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(rl.resetTime / 1000)));

    return response;
  };
}

// ============================================
// Auth Integration
// ============================================

export type AuthLevel = 'user' | 'staff' | 'admin' | 'super_admin';

export function withAuth(
  handler: RouteHandler,
  level: AuthLevel = 'user'
): RouteHandler {
  return async (request) => {
    try {
      let auth;
      switch (level) {
        case 'user':
          auth = await requireAuth();
          break;
        case 'staff':
          auth = await requireStaff();
          break;
        case 'admin':
          auth = await requireAdmin();
          break;
        case 'super_admin':
          auth = await requireSuperAdmin();
          break;
      }

      (request as any).auth = auth;
      return await handler(request);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function createProtectedHandler<TBody = any, TQuery = any>(
  bodySchema: ZodSchema<TBody> | null,
  querySchema: ZodSchema<TQuery> | null,
  handler: RouteHandler<TBody>,
  options: {
    authLevel?: AuthLevel;
    rateLimit?: RateLimitConfig;
  } = {}
) {
  let wrappedHandler = createHandler(bodySchema, querySchema, handler);

  if (options.rateLimit) {
    wrappedHandler = withRateLimit(wrappedHandler, options.rateLimit);
  }

  if (options.authLevel) {
    wrappedHandler = withAuth(wrappedHandler, options.authLevel);
  }

  return wrappedHandler;
}