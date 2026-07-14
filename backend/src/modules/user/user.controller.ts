import { Body, Controller, Get, Param, Patch, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetInterestsDto } from './dto/set-interests.dto';
import { SetLanguagesDto } from './dto/set-languages.dto';
import { SetPreferenceDto } from './dto/set-preference.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.userService.getMe(user.sub);
  }

  // FS-27 — thống kê giờ chat & số hội thoại (route cụ thể phải đứng trước :id)
  @Get(':id/chat-stats')
  getChatStats(@Param('id') id: string) {
    return this.userService.getChatStats(Number(id));
  }

  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.userService.getProfile(Number(id));
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(user.sub, dto);
  }

  @Patch('me/password')
  changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(user.sub, dto);
  }

  @Put('me/languages')
  setLanguages(@CurrentUser() user: JwtPayload, @Body() dto: SetLanguagesDto) {
    return this.userService.setLanguages(user.sub, dto);
  }

  @Put('me/interests')
  setInterests(@CurrentUser() user: JwtPayload, @Body() dto: SetInterestsDto) {
    return this.userService.setInterests(user.sub, dto);
  }

  @Put('me/preference')
  setPreference(@CurrentUser() user: JwtPayload, @Body() dto: SetPreferenceDto) {
    return this.userService.setPreference(user.sub, dto);
  }
}
