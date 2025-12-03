import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

import { ApiResponse } from '../types/api-response.type.js';

// Ensures error responses match success response format for consistent API contract
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  public catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'An error occurred';
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const response = exceptionResponse as Record<string, unknown>;
      if ('message' in response) {
        const msg = response.message;
        message = Array.isArray(msg) ? msg.join(', ') : String(msg);
      }
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      message,
      data: null,
    };

    response.status(status).json(errorResponse);
  }
}

// Safety net for uncaught errors to maintain consistent API response format
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        if ('message' in resp) {
          const msg = resp.message;
          message = Array.isArray(msg) ? msg.join(', ') : String(msg);
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse: ApiResponse<null> = {
      success: false,
      message,
      data: null,
    };

    response.status(status).json(errorResponse);
  }
}
