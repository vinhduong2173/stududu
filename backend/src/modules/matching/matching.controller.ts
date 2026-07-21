import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { MatchingService } from './matching.service';

@Controller('matching')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  // FS-08 — gợi ý 6–10 người + phân trang "xem thêm" (?offset=)
  @Get('suggestions')
  getSuggestions(
    @CurrentUser() user: JwtPayload,
    @Query('languageId') languageId?: string,
    @Query('offset') offset?: string,
  ) {
    return this.matchingService.getSuggestions(user.sub, {
      languageId: languageId ? Number(languageId) : undefined,
      offset: offset ? Number(offset) : 0,
    });
  }

  // Tab "Tất cả thành viên" (?offset=)
  @Get('members')
  getAllMembers(@CurrentUser() user: JwtPayload, @Query('offset') offset?: string) {
    return this.matchingService.getAllMembers(user.sub, offset ? Number(offset) : 0);
  }

  // Like — logic mới: 1 chiều là mở hội thoại ngay (skip đã bỏ khỏi sản phẩm)
  @Post('like/:targetId')
  like(@CurrentUser() user: JwtPayload, @Param('targetId', ParseIntPipe) targetId: number) {
    return this.matchingService.like(user.sub, targetId);
  }

  @Delete('like/:targetId')
  unlike(@CurrentUser() user: JwtPayload, @Param('targetId', ParseIntPipe) targetId: number) {
    return this.matchingService.unlike(user.sub, targetId);
  }

  // Trạng thái quan hệ với 1 hồ sơ: đã thích chưa + id hội thoại (trang hồ sơ đối tác)
  @Get('relation/:targetId')
  getRelation(
    @CurrentUser() user: JwtPayload,
    @Param('targetId', ParseIntPipe) targetId: number,
  ) {
    return this.matchingService.getRelation(user.sub, targetId);
  }
}
