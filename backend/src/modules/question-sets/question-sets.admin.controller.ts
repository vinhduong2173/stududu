import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { AttemptsService } from './attempts.service';
import { ChallengesService } from './challenges.service';
import { MAX_FILE_BYTES } from './file-extractor.service';
import { QuestionSetsService } from './question-sets.service';
import {
  CreateChallengeDto,
  CreateQuestionSetDto,
  GenerateQuestionsDto,
  ImportQuestionsDto,
  ListQuestionSetsQueryDto,
  QuestionPayloadDto,
  UpdateQuestionDto,
  UpdateQuestionSetDto,
  VocabTopicDto,
} from './dto/question-set.dto';

/** BR-11/BR-47 — toàn bộ luồng soạn đề chỉ dành cho role = admin */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class QuestionSetsAdminController {
  constructor(
    private readonly service: QuestionSetsService,
    private readonly attempts: AttemptsService,
    private readonly challenges: ChallengesService,
  ) {}

  // ----- Chủ đề từ vựng -----

  @Get('vocab-topics')
  listVocabTopics() {
    return this.service.listVocabTopics(true);
  }

  @Post('vocab-topics')
  createVocabTopic(@Body() dto: VocabTopicDto) {
    return this.service.createVocabTopic(dto);
  }

  @Patch('vocab-topics/:id')
  updateVocabTopic(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VocabTopicDto,
  ) {
    return this.service.updateVocabTopic(id, dto);
  }

  // ----- Bộ đề -----

  @Get('question-sets')
  listSets(@Query() query: ListQuestionSetsQueryDto) {
    return this.service.listSets(query);
  }

  @Post('question-sets')
  createSet(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: CreateQuestionSetDto,
  ) {
    return this.service.createSet(admin.sub, dto);
  }

  @Get('question-sets/:id')
  getSet(@Param('id', ParseIntPipe) id: number) {
    return this.service.getSet(id);
  }

  @Patch('question-sets/:id')
  updateSet(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestionSetDto,
  ) {
    return this.service.updateSet(admin.sub, id, dto);
  }

  // ----- Sinh câu hỏi bằng AI (chỉ dry-run, chưa lưu — BR-48) -----

  @Post('question-sets/:id/generate')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }),
  )
  generate(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: GenerateQuestionsDto,
  ) {
    if (!file) {
      throw new BadRequestException('Chưa chọn file tài liệu (PDF/DOCX/TXT).');
    }
    return this.service.generateFromFile(id, file, dto);
  }

  // ----- Thêm/sửa/xoá câu hỏi -----

  /** Thêm 1 câu thủ công — lối cứu hộ khi AI không dùng được (BR-56) */
  @Post('question-sets/:id/questions')
  addQuestion(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: QuestionPayloadDto,
  ) {
    return this.service.addManualQuestion(admin.sub, id, dto);
  }

  /** Nhập hàng loạt các câu đã đạt ở bảng xem trước */
  @Post('question-sets/:id/questions/import')
  importQuestions(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ImportQuestionsDto,
  ) {
    return this.service.importQuestions(admin.sub, id, dto);
  }

  @Patch('questions/:id')
  updateQuestion(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.service.updateQuestion(admin.sub, id, dto);
  }

  @Delete('questions/:id')
  removeQuestion(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.removeQuestion(admin.sub, id);
  }

  // ----- Làm thử + publish -----

  @Get('question-sets/:id/publish-gate')
  publishGate(@Param('id', ParseIntPipe) id: number) {
    return this.service.getPublishGate(id);
  }

  /** Admin làm thử — điều kiện thứ hai của cửa publish */
  @Post('question-sets/:id/attempt')
  startTrial(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.attempts.start(admin.sub, id);
  }

  @Post('question-sets/:id/publish')
  publish(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.publish(admin.sub, id);
  }

  @Post('question-sets/:id/unpublish')
  unpublish(
    @CurrentUser() admin: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.unpublish(admin.sub, id);
  }

  @Delete('question-sets/:id')
  deleteSet(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteSet(id);
  }

  // ----- Thử thách community -----

  @Post('challenges')
  createChallenge(
    @CurrentUser() admin: JwtPayload,
    @Body() dto: CreateChallengeDto,
  ) {
    return this.challenges.create(admin.sub, dto);
  }

  @Delete('challenges/:id')
  removeChallenge(@Param('id', ParseIntPipe) id: number) {
    return this.challenges.remove(id);
  }
}
