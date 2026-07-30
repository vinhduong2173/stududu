import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { APIResponse } from '../types/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, APIResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<APIResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response?.statusCode ?? 200;

    return next.handle().pipe(
      map((data) => {
        // Nếu response đã được định dạng sẵn theo APIResponse thì giữ nguyên
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'statusCode' in data &&
          'data' in data
        ) {
          return data as APIResponse<T>;
        }

        // Tách custom message nếu controller trả về object { message: '...', ... }
        let message = 'Success';
        let responseData = data;

        if (data && typeof data === 'object' && !Array.isArray(data)) {
          if ('message' in data && typeof data.message === 'string') {
            message = data.message;
            // Nếu object chỉ chứa { message }, data trả về sẽ là null
            const { message: _, ...rest } = data;
            responseData = Object.keys(rest).length > 0 ? (rest as T) : null;
          }
        }

        return {
          success: true,
          statusCode,
          message,
          data: responseData ?? null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
