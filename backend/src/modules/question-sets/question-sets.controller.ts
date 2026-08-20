import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { AttemptsService } from './attempts.service';
import { ChallengesService } from './challenges.service';
import { MAX_FILE_BYTES } from './file-extractor.service';
import { QuestionSetsService } from './question-sets.service';
import {
  CreateQuestionSetDto,
  GenerateQuestionsDto,
  ImportQuestionsDto,
  ListQuestionSetsQueryDto,
  SubmitAttemptDto,
} from './dto/question-set.dto';

/** Phía người học */
@Controller('question-sets')
@UseGuards(JwtAuthGuard)
export class QuestionSetsController {
  constructor(
    private readonly attempts: AttemptsService,
    private readonly sets: QuestionSetsService,
  ) {}

  @Get('topics')
  listTopics() {
    return this.sets.listVocabTopics();
  }

  @Get('quota')
  quota(@CurrentUser() user: JwtPayload) {
    return this.attempts.getDailyQuota(user.sub);
  }

  @Get('history')
  history(@CurrentUser() user: JwtPayload, @Query('setId') setId?: string) {
    return this.attempts.history(
      user.sub,
      setId ? parseInt(setId, 10) : undefined,
    );
  }

  @Get('my-sets')
  mySets(@CurrentUser() user: JwtPayload) {
    return this.sets.listSets({ createdById: user.sub });
  }

  @Post('user-create')
  userCreate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateQuestionSetDto,
  ) {
    return this.sets.createSet(user.sub, dto);
  }

  @Post(':id/user-generate')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_BYTES } }),
  )
  userGenerate(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: GenerateQuestionsDto,
  ) {
    if (!file) {
      throw new BadRequestException('Chưa chọn file tài liệu (PDF/DOCX/TXT).');
    }
    return this.sets.generateFromFile(id, file, dto);
  }

  @Post(':id/user-import')
  userImport(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ImportQuestionsDto,
  ) {
    return this.sets.importQuestions(user.sub, id, dto);
  }

  @Post(':id/user-publish')
  userPublish(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.sets.userPublishSet(user.sub, id);
  }

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListQuestionSetsQueryDto,
  ) {
    return this.attempts.listPublishedSets(user.sub, query);
  }

  /** Bắt đầu làm bài (hạn mức 3 bộ/ngày áp ở service) */
  @Post(':id/attempts')
  start(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Query('challengeId') challengeId?: string,
  ) {
    return this.attempts.start(
      user.sub,
      id,
      challengeId ? parseInt(challengeId, 10) : undefined,
    );
  }

  @Get(':id/leaderboard')
  leaderboard(@Param('id', ParseIntPipe) id: number) {
    return this.attempts.getLeaderboard(id);
  }

  @Get(':id/result')
  result(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Query('attemptId') attemptId?: string,
  ) {
    return this.attempts.getAttemptDetail(
      user.sub,
      id,
      attemptId ? parseInt(attemptId, 10) : undefined,
    );
  }
}

@Controller('attempts')
@UseGuards(JwtAuthGuard)
export class AttemptsController {
  constructor(private readonly attempts: AttemptsService) {}

  @Post(':id/submit')
  submit(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.attempts.submit(user.sub, id, dto);
  }

  @Get(':id/detail')
  detail(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.attempts.getAttemptDetail(user.sub, 0, id);
  }
}

/** Thử thách community — BXH chỉ trong phạm vi thử thách (giữ BR-13) */
@Controller('challenges')
@UseGuards(JwtAuthGuard)
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.challenges.list(user.sub);
  }

  @Get(':id/leaderboard')
  leaderboard(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.challenges.leaderboard(id, user.sub);
  }
}
