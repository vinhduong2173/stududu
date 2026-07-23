import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { APIResponse } from '../types/api-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: any =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    let errors: string[] | Record<string, unknown> | undefined = undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      if (Array.isArray(exceptionResponse.message)) {
        message = 'Validation failed';
        errors = exceptionResponse.message;
      } else if (typeof exceptionResponse.message === 'string') {
        message = exceptionResponse.message;
      }
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponseBody: APIResponse<null> = {
      success: false,
      statusCode: status,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      ...(errors ? { errors } : {}),
    };

    response.status(status).json(errorResponseBody);
  }
}
