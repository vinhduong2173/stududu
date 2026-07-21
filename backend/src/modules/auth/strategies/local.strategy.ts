import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { I18nService, I18nContext } from 'nestjs-i18n';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private readonly i18n: I18nService,
  ) {
    // passport-local mặc định expect trường username và password
    // ta cần mapping usernameField thành email vì hệ thống dùng email đăng nhập
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException(this.i18n.t('translation.auth.invalidCredentials', { lang: I18nContext.current()?.lang }));
    }
    return user; // Return user object, sẽ được gắn vào request.user
  }
}
