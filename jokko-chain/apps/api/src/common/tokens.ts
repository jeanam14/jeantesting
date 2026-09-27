/**
 * Dependency-injection tokens for values that are not classes. Using symbols (not strings)
 * makes accidental collisions impossible.
 */

/** Validated {@link import('../config/env.js').AppConfig}. */
export const APP_CONFIG = Symbol('APP_CONFIG');
/** Typed Drizzle {@link import('../database/db.js').Database}. */
export const DATABASE = Symbol('DATABASE');
/** {@link import('../database/db.js').DatabaseHandle} (for shutdown). */
export const DATABASE_HANDLE = Symbol('DATABASE_HANDLE');
/** {@link import('./clock.js').Clock}. */
export const CLOCK = Symbol('CLOCK');
