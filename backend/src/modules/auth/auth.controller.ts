import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Request, Res, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { GoogleAuthGuard } from '../../common/guards/google-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Request() req: any) {
    // req.user được gán bởi LocalStrategy
    return this.authService.login(req.user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googlePostLogin(@Body('idToken') idToken?: string) {
    if (!idToken) {
      throw new BadRequestException('Trường idToken không được để trống.');
    }
    return this.authService.googleLoginToken(idToken);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Kích hoạt redirect của passport-google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Request() req: any, @Res() res: any) {
    const loginResult = await this.authService.googleLogin(req.user);
    const frontendUrl = this.config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${loginResult.tokens.accessToken}&refreshToken=${loginResult.tokens.refreshToken}`;
    return res.redirect(redirectUrl);
  }
}
