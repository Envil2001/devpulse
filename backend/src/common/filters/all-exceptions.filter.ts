import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { type Request, type Response } from 'express';

import { type ApiErrorResponse } from '@devpulse/lib';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { status, message, details } = this.resolveException(exception);

    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: status,
        message,
        ...(details !== undefined && { details }),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${String(status)}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  private resolveException(exception: unknown): {
    status: number;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();

      if (typeof raw === 'object' && 'message' in raw) {
        const { message } = raw;
        if (Array.isArray(message)) {
          return {
            status,
            message: 'Validation failed',
            details: message,
          };
        }
        return { status, message: String(message) };
      }

      return { status, message: typeof raw === 'string' ? raw : JSON.stringify(raw) };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }
}
