import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { User, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { I18nService, I18nContext } from 'nestjs-i18n';
import type { GoogleProfile } from './strategies/google.strategy';

const BCRYPT_ROUNDS = 10;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  // US-01 — đăng ký
  async register(dto: RegisterDto): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException(this.i18n.t('translation.auth.emailExists', { lang: I18nContext.current()?.lang }));
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, displayName: dto.displayName },
    });

    return { user: this.toPublic(user), tokens: await this.issueTokens(user) };
  }

  async googleLogin(profile: GoogleProfile): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    // Check if user already exists with this Google ID
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.googleId },
        });
      } else {
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            googleId: profile.googleId,
          },
        });
      }
    }

    await this.assertNotSuspended(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    return { user: this.toPublic(user), tokens: await this.issueTokens(user) };
  }

  // US-02 — đăng nhập (không tiết lộ email có tồn tại hay không)
  // TODO US-02: khóa đăng nhập tạm 15 phút sau 5 lần sai liên tiếp
  // US-02 — kiểm tra email/pass cho LocalStrategy
  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && user.passwordHash && (await bcrypt.compare(pass, user.passwordHash))) {
      await this.assertNotSuspended(user);
      return user;
    }
    return null;
  }

  // Đăng nhập (khi đã pass qua LocalAuthGuard)
  async login(user: User): Promise<{ user: PublicUser; tokens: AuthTokens }> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    return { user: this.toPublic(user), tokens: await this.issueTokens(user) };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(this.i18n.t('translation.auth.invalidRefreshToken', { lang: I18nContext.current()?.lang }));
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException();
    await this.assertNotSuspended(user);

    return this.issueTokens(user);
  }

  // US-20 — tài khoản suspended không đăng nhập được; tự mở lại khi hết hạn.
  // AC3: thông báo cho người dùng cả LÝ DO (từ log kiểm duyệt) + THỜI HẠN.
  private async assertNotSuspended(user: User): Promise<void> {
    if (user.status === UserStatus.deleted) {
      throw new ForbiddenException(this.i18n.t('translation.auth.accountBanned', { lang: I18nContext.current()?.lang }));
    }
    if (user.status === UserStatus.suspended) {
      if (user.suspendedUntil && user.suspendedUntil <= new Date()) {
        // hết hạn khóa → tự kích hoạt lại
        await this.prisma.user.update({
          where: { id: user.id },
          data: { status: UserStatus.active, suspendedUntil: null },
        });
        return;
      }

      const lastAction = await this.prisma.moderationAction.findFirst({
        where: { targetUserId: user.id },
        orderBy: { createdAt: 'desc' },
      });
      const lang = I18nContext.current()?.lang;
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
      const reasonStr = lastAction ? (lang === 'en' ? ` — reason: ${lastAction.reason}` : ` — lý do: ${lastAction.reason}`) : '';
      throw new ForbiddenException(
        this.i18n.t('translation.auth.accountSuspended', {
          lang,
          args: { until, reason: reasonStr },
        }),
      );
    }
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ??
          '30m') as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ??
          '7d') as JwtSignOptions['expiresIn'],
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private toPublic(user: User): PublicUser {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }
}
