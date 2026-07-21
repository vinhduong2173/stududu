import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../../../common/types/jwt-payload';
import { PrismaService } from '../../../prisma/prisma.service';
import { I18nService, I18nContext } from 'nestjs-i18n';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const lang = I18nContext.current()?.lang;

    if (!payload.sub) {
      throw new UnauthorizedException(this.i18n.t('translation.auth.invalidToken', { lang }));
    }

    // US-20 AC1 — tài khoản bị khóa/xóa không dùng được API dù token còn hạn
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { status: true, suspendedUntil: true },
    });
    if (!user || user.status === UserStatus.deleted) {
      throw new UnauthorizedException(this.i18n.t('translation.auth.accountDeleted', { lang }));
    }
    if (user.status === UserStatus.suspended) {
      // hết hạn khóa → tự kích hoạt lại
      if (user.suspendedUntil && user.suspendedUntil <= new Date()) {
        await this.prisma.user.update({
          where: { id: payload.sub },
          data: { status: UserStatus.active, suspendedUntil: null },
        });
      } else {
        const locale = lang === 'en' ? 'en-US' : 'vi-VN';
        const until = user.suspendedUntil
          ? user.suspendedUntil.toLocaleString(locale, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : (lang === 'en' ? 'further notice' : 'khi có thông báo mới');
        throw new ForbiddenException(
          this.i18n.t('translation.auth.accountSuspended', {
            lang,
            args: { until, reason: '' },
          }),
        );
      }
    }

    // Nếu payload hợp lệ, object này sẽ được gán vào request.user
    return payload;
  }
}
