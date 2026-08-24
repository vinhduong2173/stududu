import {
  Body,
  Controller,
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
import { AttemptsService } from './attempts.service';
import { ChallengesService } from './challenges.service';
import { QuestionSetsService } from './question-sets.service';
import {
  ListQuestionSetsQueryDto,
  SubmitAttemptDto,
} from './dto/question-set.dto';

/** Phía người học — chỉ thấy bộ đề đã publish */
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
