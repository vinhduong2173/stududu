import { BadRequestException, Injectable } from '@nestjs/common';
import { EndorsementLabel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { EndorseDto } from './dto/endorse.dto';

@Injectable()
export class TrustService {
  constructor(private readonly prisma: PrismaService) {}

  // US-17 — report người dùng; FS-24/25 — report nội dung (post / word_library)
  report(reporterId: number, dto: CreateReportDto) {
    if (reporterId === dto.reportedId) {
      throw new BadRequestException('Không thể report chính mình');
    }
    return this.prisma.report.create({
      data: {
        reporterId,
        reportedId: dto.reportedId,
        reason: dto.reason,
        targetType: dto.targetType,
        targetId: dto.targetId,
      },
    });
  }

  // US-18 — block
  async block(blockerId: number, blockedId: number) {
    if (blockerId === blockedId) {
      throw new BadRequestException('Không thể block chính mình');
    }
    return this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      update: {},
      create: { blockerId, blockedId },
    });
  }

  // US-18 AC3 — unblock
  async unblock(blockerId: number, blockedId: number) {
    await this.prisma.block.deleteMany({ where: { blockerId, blockedId } });
    return { unblocked: blockedId };
  }

  getBlocks(blockerId: number) {
    return this.prisma.block.findMany({
      where: { blockerId },
      include: {
        blocked: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    });
  }

  // FS-26 — ghi nhận định tính; chỉ khi đã từng trò chuyện với nhau (≥1 CONVERSATION)
  async endorse(giverId: number, dto: EndorseDto) {
    if (giverId === dto.receiverId) {
      throw new BadRequestException('Không thể tự ghi nhận chính mình');
    }

    const sharedConversation = await this.prisma.conversation.findFirst({
      where: {
        match: {
          OR: [
            { memberId: giverId, candidateId: dto.receiverId },
            { memberId: dto.receiverId, candidateId: giverId },
          ],
        },
      },
    });
    if (!sharedConversation) {
      throw new BadRequestException('Chỉ ghi nhận được người bạn đã từng trò chuyện cùng');
    }

    // UNIQUE(giver, receiver, label) — lặp lại thì bỏ qua, không cộng dồn (BR-13)
    await this.prisma.endorsement.createMany({
      data: dto.labels.map((label) => ({
        giverId,
        receiverId: dto.receiverId,
        label,
      })),
      skipDuplicates: true,
    });

    return this.getEndorsements(dto.receiverId);
  }

  // FS-26 — đếm số lượt theo từng nhãn (KHÔNG tính trung bình/xếp hạng — BR-13)
  async getEndorsements(userId: number) {
    const grouped = await this.prisma.endorsement.groupBy({
      by: ['label'],
      where: { receiverId: userId },
      _count: { _all: true },
    });

    const counts: Record<string, number> = {};
    for (const label of Object.values(EndorsementLabel)) counts[label] = 0;
    for (const g of grouped) counts[g.label] = g._count._all;
    return counts;
  }

  /** Nhãn mình đã ghi nhận cho một người (để FE disable checkbox đã chọn) */
  async getGivenEndorsements(giverId: number, receiverId: number) {
    const rows = await this.prisma.endorsement.findMany({
      where: { giverId, receiverId },
      select: { label: true },
    });
    return rows.map((r) => r.label);
  }
}
