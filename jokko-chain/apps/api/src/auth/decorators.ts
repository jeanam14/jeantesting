/**
 * Route decorators for the public API.
 *
 * Default is SECURE: every route requires a valid Privy token AND a registered, non-closed
 * Jokko user. Routes opt OUT explicitly (`@Public()`, `@AllowUnregistered()`), which makes
 * every exception visible in code review.
 */
import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ApiError } from '../common/errors.js';
import type { AuthenticatedUser, DeviceContext, JokkoRequestContext } from './request-context.js';

/** Metadata keys read by the guards. */
export const IS_PUBLIC = 'jokko:isPublic';
export const ALLOW_UNREGISTERED = 'jokko:allowUnregistered';
export const REQUIRES_ACTIVE_ACCOUNT = 'jokko:requiresActiveAccount';
export const REQUIRED_FEATURE = 'jokko:requiredFeature';

/** No authentication at all (health checks, public config, provider webhooks). */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC, true);

/** Valid Privy token required, but the Jokko user may not exist yet (session bootstrap). */
export const AllowUnregistered = (): MethodDecorator => SetMetadata(ALLOW_UNREGISTERED, true);

/**
 * The user must be `active` (not `restricted`). Put on every route that moves money or creates
 * a financial commitment; restricted users keep read access to their own data.
 */
export const RequiresActiveAccount = (): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRES_ACTIVE_ACCOUNT, true);

/** The feature flag must be on, otherwise `FEATURE_DISABLED` (kill switch). */
export const RequiresFeature = (flag: string): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRED_FEATURE, flag);

function context(ctx: ExecutionContext): JokkoRequestContext {
  const request = ctx.switchToHttp().getRequest<FastifyRequest>();
  if (!request.jokko) throw new ApiError('UNAUTHENTICATED', 'authentication required');
  return request.jokko;
}

/** Injects the authenticated user (throws on unregistered sessions). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const user = context(ctx).user;
    if (!user) throw new ApiError('UNAUTHENTICATED', 'session not registered');
    return user;
  },
);

/** Injects the calling device. */
export const CurrentDevice = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DeviceContext => context(ctx).device,
);

/** Injects the full request context (session + optional user + device). */
export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JokkoRequestContext => context(ctx),
);

/** Injects the `Idempotency-Key` header value (validated by `IdempotencyService`). */
export const IdempotencyKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const value = ctx.switchToHttp().getRequest<FastifyRequest>().headers['idempotency-key'];
    return typeof value === 'string' ? value : undefined;
  },
);
