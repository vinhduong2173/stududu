import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsString, Matches, MaxLength } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { CommunityService } from './community.service';

export class CreatePostDto {
  @IsString()
  @Matches(/\S/, { message: 'Nội dung bài viết không được để trống' })
  @MaxLength(500, { message: 'Bài viết tối đa 500 ký tự' })
  content!: string;
}

@Controller('community')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // FS-25 — feed public; nếu có token hợp lệ thì kèm likedByMe
  @Get('feed')
  async feed(@Headers('authorization') authorization?: string) {
    let viewerId: number | undefined;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
          secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });
        viewerId = payload.sub;
      } catch {
        // token hỏng → xem như khách
      }
    }
    return this.communityService.feed(viewerId);
  }

  // Đăng bài chia sẻ tự do
  @Post('posts')
  @UseGuards(JwtAuthGuard)
  createPost(@CurrentUser() user: JwtPayload, @Body() dto: CreatePostDto) {
    return this.communityService.createPost(user.sub, dto.content);
  }

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  like(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.communityService.like(user.sub, id);
  }

  @Delete('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  unlike(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.communityService.unlike(user.sub, id);
  }
}
