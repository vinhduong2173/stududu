import { Module } from '@nestjs/common';
import { AiQuestionGeneratorService } from './ai-question-generator.service';
import { AttemptsService } from './attempts.service';
import { ChallengesService } from './challenges.service';
import { FileExtractorService } from './file-extractor.service';
import { QuestionValidatorService } from './question-validator.service';
import { QuestionSetsAdminController } from './question-sets.admin.controller';
import {
  AttemptsController,
  ChallengesController,
  QuestionSetsController,
} from './question-sets.controller';
import { QuestionSetsService } from './question-sets.service';

@Module({
  controllers: [
    QuestionSetsAdminController,
    QuestionSetsController,
    AttemptsController,
    ChallengesController,
  ],
  providers: [
    QuestionSetsService,
    AttemptsService,
    ChallengesService,
    FileExtractorService,
    AiQuestionGeneratorService,
    QuestionValidatorService,
  ],
  exports: [QuestionSetsService, AttemptsService, ChallengesService],
})
export class QuestionSetsModule {}
