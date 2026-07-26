import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { type Request, type Response } from 'express';
import { type Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;
    const startedAt = Date.now();

    this.logger.log(`→ ${method} ${url}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - startedAt;
          this.logger.log(`← ${method} ${url} ${String(response.statusCode)} +${String(ms)}ms`);
        },
        error: (error: unknown) => {
          const ms = Date.now() - startedAt;
          const status =
            error instanceof Error && 'status' in error
              ? (error as { status: number }).status
              : 500;
          this.logger.error(`← ${method} ${url} ${String(status)} +${String(ms)}ms`);
        },
      }),
    );
  }
}
