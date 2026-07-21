import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LanguageRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetInterestsDto } from './dto/set-interests.dto';
import { SetLanguagesDto } from './dto/set-languages.dto';
import { SetPreferenceDto } from './dto/set-preference.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        intent: true,
        role: true,
        status: true,
        lastActive: true,
        gender: true,
        dob: true,
        city: true,
        timezone: true,
        availableSlots: true,
        shareActivity: true,
        createdAt: true,
        languages: { include: { language: true } },
        interests: { include: { topic: true } },
        matchPreference: true,
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    // Lấy mã ngôn ngữ native — dùng cho popup tra từ (ngôn ngữ dịch mặc định)
    const nativeLang =
      user.languages.find((l) => l.role === LanguageRole.native)?.language.code ?? null;

    return { ...user, nativeLang };
  }

  async getProfile(currentUserId: number, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, status: 'active' },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        intent: true,
        lastActive: true,
        gender: true,
        dob: true,
        city: true,
        timezone: true,
        availableSlots: true,
        languages: { include: { language: true } },
        interests: { include: { topic: true } },
      },
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại hoặc đã bị khóa');

    return user;
  }

  updateProfile(userId: number, dto: UpdateProfileDto) {
    const { dob, ...rest } = dto;
    return this.prisma.user.update({
      where: { id: userId },
      data: { ...rest, ...(dob !== undefined ? { dob: dob ? new Date(dob) : null } : {}) },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        intent: true,
        gender: true,
        dob: true,
        city: true,
      },
    });
  }

  // US-04 — khai ngôn ngữ + trình độ (thay toàn bộ danh sách)
  async setLanguages(userId: number, dto: SetLanguagesDto) {
    for (const item of dto.languages) {
      if (item.role === LanguageRole.learning && !item.level) {
        throw new BadRequestException('Ngôn ngữ đang học cần level theo thang 1–5');
      }
      if (item.role === LanguageRole.native && item.level) {
        throw new BadRequestException('Ngôn ngữ mẹ đẻ không cần level');
      }
    }

    await this.prisma.$transaction([
      this.prisma.userLanguage.deleteMany({ where: { userId } }),
      this.prisma.userLanguage.createMany({
        data: dto.languages.map((l) => ({ userId, ...l })),
      }),
    ]);

    return this.prisma.userLanguage.findMany({
      where: { userId },
      include: { language: true },
    });
  }

  // US-05 — chọn sở thích (Topic là bộ lọc phụ, không bắt buộc)
  async setInterests(userId: number, dto: SetInterestsDto) {
    await this.prisma.$transaction([
      this.prisma.userInterest.deleteMany({ where: { userId } }),
      this.prisma.userInterest.createMany({
        data: dto.topicIds.map((topicId) => ({ userId, topicId })),
      }),
    ]);

    return this.prisma.userInterest.findMany({
      where: { userId },
      include: { topic: true },
    });
  }

  // FS-27/BR-14 — thống kê giờ chat: cắt phiên khi idle > 30 phút, tính lại khi đọc
  // (không cache — cùng triết lý MATCH_SCORE), bỏ qua hội thoại đã block nhau
  async getChatStats(userId: number) {
    const IDLE_MS = 30 * 60 * 1000;

    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    });
    const blockedWith = new Set(
      blocks.map((b) => (b.blockerId === userId ? b.blockedId : b.blockerId)),
    );

    const conversations = await this.prisma.conversation.findMany({
      where: { match: { OR: [{ memberId: userId }, { candidateId: userId }] } },
      include: {
        match: { select: { memberId: true, candidateId: true } },
        messages: { orderBy: { sentAt: 'asc' }, select: { sentAt: true } },
      },
    });

    let totalMs = 0;
    let conversationCount = 0;
    for (const conv of conversations) {
      const partnerId =
        conv.match.memberId === userId ? conv.match.candidateId : conv.match.memberId;
      if (blockedWith.has(partnerId)) continue;
      conversationCount += 1;

      const times = conv.messages.map((m) => m.sentAt.getTime());
      if (times.length === 0) continue;
      let sessionStart = times[0];
      let prev = times[0];
      for (const t of times.slice(1)) {
        if (t - prev > IDLE_MS) {
          totalMs += prev - sessionStart;
          sessionStart = t;
        }
        prev = t;
      }
      totalMs += prev - sessionStart;
    }

    return {
      totalChatHours: Math.round((totalMs / 3_600_000) * 10) / 10,
      conversationCount,
    };
  }

  // Đổi mật khẩu trong Cài đặt — yêu cầu xác nhận mật khẩu hiện tại
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Mật khẩu hiện tại không đúng');

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { success: true };
  }

  // US-07 — đặt tiêu chí ghép (0..1 bản ghi / user)
  setPreference(userId: number, dto: SetPreferenceDto) {
    return this.prisma.matchPreference.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
  }
}
