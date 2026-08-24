import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { SaveWordDto } from '../dto/save-word.dto';

@Injectable()
export class UserVocabularyService {
  constructor(private readonly prisma: PrismaService) {}

  // FS-23 — tìm/tạo WORD_LIBRARY theo (term, language) rồi gắn USER_SAVED_WORD
  async saveWord(userId: number, dto: SaveWordDto) {
    const term = dto.term.trim();

    let languageId = dto.languageId;
    if (languageId) {
      const exists = await this.prisma.language.findUnique({
        where: { id: languageId },
      });
      if (!exists) languageId = undefined;
    }

    if (!languageId) {
      const defaultLang =
        (await this.prisma.language.findUnique({ where: { code: 'en' } })) ||
        (await this.prisma.language.findFirst());
      languageId = defaultLang?.id ?? 1;
    }

    let word = await this.prisma.wordLibrary.findFirst({
      where: { term: { equals: term, mode: 'insensitive' }, languageId },
    });

    if (!word) {
      try {
        word = await this.prisma.wordLibrary.create({
          data: {
            term,
            languageId,
            phonetic: dto.phonetic,
            partOfSpeech: dto.partOfSpeech,
            definition: dto.definition,
            example: dto.example,
            audioUrl: dto.audioUrl,
          },
        });
      } catch {
        word = await this.prisma.wordLibrary.findFirst({
          where: { term: { equals: term, mode: 'insensitive' }, languageId },
        });
        if (!word) {
          throw new NotFoundException('Không thể lưu từ vựng vào thư viện');
        }
      }
    } else {
      // Cập nhật thông tin bổ sung nếu trước đó còn thiếu
      const updateData: Prisma.WordLibraryUpdateInput = {};
      if (!word.phonetic && dto.phonetic) updateData.phonetic = dto.phonetic;
      if (!word.partOfSpeech && dto.partOfSpeech)
        updateData.partOfSpeech = dto.partOfSpeech;
      if (!word.definition && dto.definition)
        updateData.definition = dto.definition;
      if (!word.example && dto.example) updateData.example = dto.example;
      if (!word.audioUrl && dto.audioUrl) updateData.audioUrl = dto.audioUrl;

      if (Object.keys(updateData).length > 0) {
        word = await this.prisma.wordLibrary.update({
          where: { id: word.id },
          data: updateData,
        });
      }
    }

    const existing = await this.prisma.userSavedWord.findUnique({
      where: { userId_wordLibraryId: { userId, wordLibraryId: word.id } },
    });

    // Đã lưu rồi → cập nhật ghi chú & trạng thái
    if (existing) {
      const saved = await this.prisma.userSavedWord.update({
        where: { id: existing.id },
        data: {
          createdAt: new Date(),
          ...(dto.personalNote !== undefined
            ? { personalNote: dto.personalNote }
            : {}),
          ...(dto.status ? { status: dto.status } : {}),
        },
        include: { word: { include: { language: true } } },
      });
      return { saved, duplicated: true };
    }

    const saved = await this.prisma.userSavedWord.create({
      data: {
        userId,
        wordLibraryId: word.id,
        personalNote: dto.personalNote,
        source: dto.source,
        status: dto.status || 'learning',
      },
      include: { word: { include: { language: true } } },
    });

    return { saved, duplicated: false };
  }

  // FS-23 — sổ từ của tôi, lọc theo status & search query nếu có
  myWords(userId: number, status?: string, search?: string) {
    const where: Prisma.UserSavedWordWhereInput = {
      userId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              {
                word: {
                  term: { contains: search.trim(), mode: 'insensitive' },
                },
              },
              {
                personalNote: { contains: search.trim(), mode: 'insensitive' },
              },
            ],
          }
        : {}),
    };

    return this.prisma.userSavedWord.findMany({
      where,
      include: { word: { include: { language: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Cập nhật trạng thái từ vựng (learning ↔ mastered)
  async updateWordStatus(userId: number, id: number, status: string) {
    const item = await this.prisma.userSavedWord.findUnique({ where: { id } });
    if (!item || item.userId !== userId) {
      throw new NotFoundException(
        'Không tìm thấy từ vựng trong sổ tay của bạn.',
      );
    }

    const updated = await this.prisma.userSavedWord.update({
      where: { id },
      data: { status },
    });

    return {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.createdAt,
    };
  }

  async removeSavedWord(userId: number, id: number) {
    const item = await this.prisma.userSavedWord.findUnique({ where: { id } });
    if (!item || item.userId !== userId) {
      throw new NotFoundException('Không tìm thấy từ trong sổ của bạn');
    }
    await this.prisma.userSavedWord.delete({ where: { id } });
    return { deleted: id };
  }
}
