import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../../../common/types/jwt-payload';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    // US-20 AC1 — tài khoản bị khóa/xóa không dùng được API dù token còn hạn
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { status: true, suspendedUntil: true },
    });
    if (!user || user.status === UserStatus.deleted) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị xóa');
    }
    if (user.status === UserStatus.suspended) {
      // hết hạn khóa → tự kích hoạt lại
      if (user.suspendedUntil && user.suspendedUntil <= new Date()) {
        await this.prisma.user.update({
          where: { id: payload.sub },
          data: { status: UserStatus.active, suspendedUntil: null },
        });
      } else {
        throw new ForbiddenException(
          `Tài khoản đang bị tạm khóa đến ${
            user.suspendedUntil?.toLocaleString('vi-VN') ?? 'khi có thông báo mới'
          }`,
        );
      }
    }

    // Nếu payload hợp lệ, object này sẽ được gán vào request.user
    return payload;
  }
}
