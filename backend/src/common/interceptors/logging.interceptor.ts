import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';
import type { JwtPayload } from '../types/jwt-payload';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl, ip } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const user = request.user as JwtPayload | undefined;
          const userId = user?.sub ?? 'anonymous';
          this.logger.log(
            `${method} ${originalUrl} ${response.statusCode} - ${Date.now() - start}ms - user=${userId} ip=${ip}`,
          );
        },
        error: (err: Error & { status?: number }) => {
          const user = request.user as JwtPayload | undefined;
          const userId = user?.sub ?? 'anonymous';
          this.logger.error(
            `${method} ${originalUrl} ${err.status ?? 500} - ${Date.now() - start}ms - user=${userId} ip=${ip} - ${err.message}`,
            err.stack,
          );
        },
      }),
    );
  }
}
