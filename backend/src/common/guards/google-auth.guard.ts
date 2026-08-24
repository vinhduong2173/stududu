import {
  Injectable,
  ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const req = context.switchToHttp().getRequest();
      console.error(
        '[GoogleAuthGuard] Passport Google Authentication Error:',
        err || info,
      );
      req.authError =
        err?.message ||
        info?.message ||
        'Mã xác thực Google đã hết hạn hoặc không hợp lệ. Vui lòng thử đăng nhập lại.';
      return null;
    }
    return user;
  }
}

