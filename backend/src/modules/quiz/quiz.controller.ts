import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../../common/types/jwt-payload';
import { CreateQuizDto, ParseQuizDto, SubmitQuizDto, ExplainQuestionDto, SaveFeedbackDto } from './dto/quiz.dto';
import { QuizService } from './quiz.service';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('parse-file')
  @UseInterceptors(FileInterceptor('file'))
  async parseFile(@UploadedFile() file?: { buffer?: Buffer; originalname?: string; mimetype?: string }) {
    if (!file || !file.buffer) {
      throw new Error('Vui lòng tải lên file hợp lệ');
    }
    return this.quizService.parseFileBuffer(file.buffer, file.mimetype || '', file.originalname || '');
  }

  @Post('parse-text')
  async parseText(@Body() dto: ParseQuizDto) {
    if (!dto.text) {
      throw new Error('Vui lòng nhập văn bản đề thi');
    }
    return this.quizService.parseText(dto.text);
  }

  @Post('explain-question')
  async explainQuestion(@Body() dto: ExplainQuestionDto) {
    return this.quizService.explainQuestion(dto);
  }

  @Post()
  async createQuiz(@CurrentUser() user: JwtPayload, @Body() dto: CreateQuizDto) {
    return this.quizService.createQuiz(user.sub, dto);
  }

  @Get('my')
  async getMyQuizzes(@CurrentUser() user: JwtPayload) {
    return this.quizService.getMyQuizzes(user.sub);
  }

  @Get('submission/:submissionId')
  async getSubmissionDetails(
    @CurrentUser() user: JwtPayload,
    @Param('submissionId', ParseIntPipe) submissionId: number,
  ) {
    return this.quizService.getSubmissionDetails(user.sub, submissionId);
  }

  @Get('submission/:submissionId/my-feedback')
  async getStudentFeedback(
    @CurrentUser() user: JwtPayload,
    @Param('submissionId', ParseIntPipe) submissionId: number,
  ) {
    return this.quizService.getStudentFeedback(user.sub, submissionId);
  }

  @Post('submission/:submissionId/feedback')
  async saveSubmissionFeedback(
    @CurrentUser() user: JwtPayload,
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() dto: SaveFeedbackDto,
  ) {
    return this.quizService.saveSubmissionFeedback(user.sub, submissionId, dto);
  }

  @Get(':id')
  async getQuizById(@Param('id', ParseIntPipe) id: number) {
    return this.quizService.getQuizById(id);
  }

  @Post(':id/submit')
  async submitQuiz(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitQuizDto,
  ) {
    return this.quizService.submitQuiz(user.sub, id, dto);
  }

  @Get(':id/submissions')
  async getSubmissions(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.quizService.getSubmissions(user.sub, id);
  }

  @Put(':id')
  async updateQuiz(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateQuizDto,
  ) {
    return this.quizService.updateQuiz(user.sub, id, dto);
  }

  @Delete(':id')
  async deleteQuiz(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    return this.quizService.deleteQuiz(user.sub, id);
  }
}
