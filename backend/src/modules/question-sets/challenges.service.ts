import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SetStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChallengeDto } from './dto/question-set.dto';

/**
 * Thử thách community — một bộ đề mở trong khoảng thời gian, có bảng xếp hạng.
 *
 * ⚠️ Phạm vi BXH: CHỈ trong màn thử thách. Không có điểm tích luỹ trên hồ sơ,
 * không có rank toàn hệ thống — BR-13 (no-credit) không bị vi phạm.
 * Xem question-set-design.md mục 7.
 */

/** Trần số dòng đọc lên để xếp hạng — đủ cho quy mô MVP, tránh quét bảng vô hạn */
const LEADERBOARD_SCAN_LIMIT = 500;

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(adminId: number, dto: CreateChallengeDto) {
    const set = await this.prisma.questionSet.findUnique({
      where: { id: dto.setId },
    });
    if (!set) throw new NotFoundException('Không tìm thấy bộ đề');
    if (set.status !== SetStatus.published) {
      throw new BadRequestException(
        'Chỉ tạo thử thách từ bộ đề đã publish — người học không thấy bộ draft.',
      );
    }

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) {
      throw new BadRequestException(
        'Thời gian kết thúc phải sau thời gian bắt đầu',
      );
    }

    return this.prisma.communityChallenge.create({
      data: {
        setId: dto.setId,
        title: dto.title,
        description: dto.description,
        startsAt,
        endsAt,
        createdById: adminId,
      },
    });
  }

  async remove(id: number) {
    const challenge = await this.prisma.communityChallenge.findUnique({
      where: { id },
    });
    if (!challenge) throw new NotFoundException('Không tìm thấy thử thách');
    // Lượt làm bài giữ lại (challengeId -> null) để không mất lịch sử của người học
    await this.prisma.communityChallenge.delete({ where: { id } });
    return { message: 'Đã xoá thử thách' };
  }

  /** Danh sách thử thách kèm trạng thái theo thời gian và tình trạng của người xem */
  async list(viewerId?: number) {
    const challenges = await this.prisma.communityChallenge.findMany({
      include: {
        set: {
          select: {
            id: true,
            title: true,
            level: true,
            framework: true,
            questionCount: true,
            language: { select: { id: true, code: true, name: true } },
            topic: { select: { id: true, name: true } },
          },
        },
        // Chỉ đếm lượt ĐÃ NỘP: đếm cả lượt mở dở thì con số "N người tham gia"
        // luôn lớn hơn số dòng trong bảng xếp hạng ngay bên dưới
        _count: {
          select: { attempts: { where: { finishedAt: { not: null } } } },
        },
        ...(viewerId
          ? {
              attempts: {
                where: { userId: viewerId },
                select: {
                  id: true,
                  correctCount: true,
                  totalCount: true,
                  startedAt: true,
                  finishedAt: true,
                },
              },
            }
          : {}),
      },
      orderBy: { endsAt: 'desc' },
      take: 20,
    });

    const now = new Date();
    return challenges.map((c) => {
      const { attempts, ...rest } = c;
      const mine = attempts?.[0] ?? null;
      return {
        ...rest,
        phase:
          now < c.startsAt ? 'upcoming' : now > c.endsAt ? 'ended' : 'running',
        participantCount: c._count.attempts,
        myAttempt: mine
          ? {
              ...mine,
              durationSec: mine.finishedAt
                ? Math.round(
                    (mine.finishedAt.getTime() - mine.startedAt.getTime()) /
                      1000,
                  )
                : null,
            }
          : null,
      };
    });
  }

  /**
   * Bảng xếp hạng: số câu đúng giảm dần, hoà thì ai xong nhanh hơn đứng trên.
   * Thời gian tính lại khi đọc (finishedAt − startedAt), không lưu sẵn.
   */
  async leaderboard(challengeId: number, viewerId?: number) {
    const challenge = await this.prisma.communityChallenge.findUnique({
      where: { id: challengeId },
      include: {
        set: {
          select: { id: true, title: true, level: true, framework: true },
        },
      },
    });
    if (!challenge) throw new NotFoundException('Không tìm thấy thử thách');

    const attempts = await this.prisma.testAttempt.findMany({
      where: { challengeId, finishedAt: { not: null } },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { correctCount: 'desc' },
      take: LEADERBOARD_SCAN_LIMIT,
    });

    const ranked = attempts
      .map((a) => ({
        userId: a.user.id,
        displayName: a.user.displayName,
        avatarUrl: a.user.avatarUrl,
        correctCount: a.correctCount,
        totalCount: a.totalCount,
        durationSec: Math.round(
          (a.finishedAt!.getTime() - a.startedAt.getTime()) / 1000,
        ),
        finishedAt: a.finishedAt,
      }))
      .sort(
        (x, y) =>
          y.correctCount - x.correctCount || x.durationSec - y.durationSec,
      )
      .map((row, i) => ({ rank: i + 1, ...row }));

    return {
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        startsAt: challenge.startsAt,
        endsAt: challenge.endsAt,
        set: challenge.set,
      },
      entries: ranked,
      myRank: viewerId
        ? (ranked.find((r) => r.userId === viewerId) ?? null)
        : null,
    };
  }
}
