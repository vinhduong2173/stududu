import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Danh mục (taxonomy) cho hồ sơ & bộ lọc — public, không cần auth
@Controller()
export class LanguageController {
  constructor(private readonly prisma: PrismaService) {}

  // US-21 — mục đã ẩn không xuất hiện trong hồ sơ & bộ lọc của member
  @Get('languages')
  getLanguages() {
    return this.prisma.language.findMany({ where: { hidden: false }, orderBy: { name: 'asc' } });
  }

  @Get('topics')
  getTopics() {
    return this.prisma.topic.findMany({ where: { hidden: false }, orderBy: { name: 'asc' } });
  }
}
