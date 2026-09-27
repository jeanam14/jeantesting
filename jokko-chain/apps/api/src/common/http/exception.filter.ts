/**
 * Converts every thrown error into the single API error shape (see `errors.ts`).
 *
 * Security: unexpected errors are logged with full detail server-side but returned to the client
 * as a generic `INTERNAL_ERROR` — stack traces, SQL and provider messages never leak.
 */
import {
  Catch,
  HttpException,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import { JokkoCoreError } from '@jokko/core';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiError, type ApiErrorCode } from '../errors.js';

/** Maps `@jokko/core` validation errors to API codes. */
const CORE_ERROR_MAP: Partial<Record<JokkoCoreError['code'], ApiErrorCode>> = {
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  TOO_MANY_DECIMALS: 'INVALID_AMOUNT',
  NEGATIVE_AMOUNT: 'INVALID_AMOUNT',
  INVALID_PHONE_NUMBER: 'INVALID_PHONE_NUMBER',
  UNSUPPORTED_COUNTRY: 'UNSUPPORTED_COUNTRY',
  UNKNOWN_NETWORK: 'VALIDATION_FAILED',
  UNKNOWN_ASSET: 'VALIDATION_FAILED',
  INVALID_FEE_SCHEDULE: 'VALIDATION_FAILED',
};

/** Global exception filter for both the public and the admin API. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ApiExceptionFilter');

  /** Formats the error and sends it. */
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const reply = http.getResponse<FastifyReply>();
    const request = http.getRequest<FastifyRequest>();
    const error = this.toApiError(exception, request);
    void reply.status(error.status).send({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
        requestId: request.id,
      },
    });
  }

  private toApiError(exception: unknown, request: FastifyRequest): ApiError {
    if (exception instanceof ApiError) return exception;
    if (exception instanceof JokkoCoreError) {
      return new ApiError(CORE_ERROR_MAP[exception.code] ?? 'VALIDATION_FAILED', exception.message);
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status === 404) return new ApiError('NOT_FOUND', 'route not found');
      if (status === 429) return new ApiError('RATE_LIMITED', 'too many requests');
      if (status === 413) return new ApiError('VALIDATION_FAILED', 'request body too large');
      if (status >= 400 && status < 500)
        return new ApiError('VALIDATION_FAILED', exception.message);
    }
    const statusCode = (exception as { statusCode?: number }).statusCode;
    if (statusCode === 429) return new ApiError('RATE_LIMITED', 'too many requests');
    if (statusCode === 400 || statusCode === 415) {
      return new ApiError('VALIDATION_FAILED', 'malformed request');
    }
    this.logger.error(
      { err: exception, requestId: request.id, route: request.routeOptions.url },
      'unhandled error',
    );
    return new ApiError('INTERNAL_ERROR', 'an unexpected error occurred');
  }
}
