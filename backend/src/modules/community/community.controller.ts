import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { CommunityService } from './community.service';

export class CreatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Bài viết tối đa 500 ký tự' })
  content?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Bài viết tối đa 500 ký tự' })
  content?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  removeImage?: boolean;
}

export class CreateCommentDto {
  @IsString()
  @MaxLength(500, { message: 'Bình luận tối đa 500 ký tự' })
  content!: string;

  @IsOptional()
  parentId?: number;
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
  async feed(
    @Headers('authorization') authorization?: string,
    @Query('userId') userIdQuery?: string,
    @Query('targetUserId') targetUserIdQuery?: string,
  ) {
    let viewerId: number | undefined;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined;
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
    const rawTargetUserId = targetUserIdQuery || userIdQuery;
    const targetId = rawTargetUserId
      ? parseInt(rawTargetUserId, 10)
      : undefined;
    return this.communityService.feed(viewerId, targetId);
  }

  // Đăng bài chia sẻ tự do
  @Post('posts')
  @UseGuards(JwtAuthGuard)
  createPost(@CurrentUser() user: JwtPayload, @Body() dto: CreatePostDto) {
    return this.communityService.createPost(
      user.sub,
      dto.content || '',
      dto.imageUrl,
    );
  }

  @Patch('posts/:id')
  @UseGuards(JwtAuthGuard)
  updatePost(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
  ) {
    return this.communityService.updatePost(user.sub, id, dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  deletePost(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.communityService.deletePost(user.sub, id);
  }

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  like(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.communityService.like(user.sub, id);
  }

  @Delete('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  unlike(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.communityService.unlike(user.sub, id);
  }

  // --- COMMENTS ENDPOINTS ---

  @Get('posts/:id/comments')
  async getComments(
    @Param('id', ParseIntPipe) id: number,
    @Headers('authorization') authorization?: string,
  ) {
    let viewerId: number | undefined;
    const token = authorization?.startsWith('Bearer ')
      ? authorization.slice(7)
      : undefined;
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
    return this.communityService.getComments(id, viewerId);
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.communityService.addComment(user.sub, id, dto);
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  deleteComment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.communityService.deleteComment(user.sub, id);
  }

  @Post('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  likeComment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.communityService.likeComment(user.sub, id);
  }

  @Delete('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  unlikeComment(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.communityService.unlikeComment(user.sub, id);
  }
}
