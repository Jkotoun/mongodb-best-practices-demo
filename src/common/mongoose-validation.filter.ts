import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';
import { Error as MongooseError } from 'mongoose';

/**
 * Principle #3 — surfaces schema-layer validation failures as clean 400s.
 *
 * The DTOs carry no class-validator rules, so invalid requests fall straight
 * through to the Mongoose schema. The errors that result are NOT HttpExceptions,
 * so without this filter Nest would return a generic 500 and bury the real
 * message in the logs. We translate the three DB-layer failure modes into a 400
 * that exposes the schema's own messages — proof that the schema is what rejects
 * the request — and delegate everything else (404s, real 500s) to Nest.
 *
 *   - ValidationError — a @Prop rule failed (min/max/match/required/enum/…)
 *   - CastError       — a value couldn't be coerced to its schema type
 *   - BSONError       — an invalid ObjectId string (matched by name; the class
 *                       isn't importable as a direct dependency under pnpm)
 */
@Catch()
export class MongooseValidationFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const isValidation = exception instanceof MongooseError.ValidationError;
    const isCast = exception instanceof MongooseError.CastError;
    const isBson = exception instanceof Error && exception.name === 'BSONError';

    if (!isValidation && !isCast && !isBson) {
      // Not a schema-layer error — let Nest handle it normally.
      super.catch(exception, host);
      return;
    }

    const message = isValidation
      ? Object.values(exception.errors).map((e) => e.message)
      : [exception.message];

    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.BAD_REQUEST)
      .json({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message,
      });
  }
}
