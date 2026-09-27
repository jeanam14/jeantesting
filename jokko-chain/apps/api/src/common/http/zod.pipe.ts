/**
 * Validation pipe backed by zod schemas. Every body, query and route parameter is validated
 * before it reaches a controller: nothing unvalidated reaches business logic or the database
 * (docs/02-security.md §6).
 */
import { Injectable, type PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { ApiError } from '../errors.js';

/** Validates and transforms input with a zod schema; unknown keys are rejected (strict schemas). */
@Injectable()
export class ZodPipe<TSchema extends z.ZodType> implements PipeTransform<
  unknown,
  z.output<TSchema>
> {
  /** @param schema - Schema the value must satisfy. */
  constructor(private readonly schema: TSchema) {}

  /** Returns the parsed value or throws `VALIDATION_FAILED` with per-field issues. */
  transform(value: unknown): z.output<TSchema> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new ApiError('VALIDATION_FAILED', 'request validation failed', {
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
