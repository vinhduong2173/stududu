import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { QuestionType } from '@prisma/client';

export class QuizQuestionItemDto {
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @IsOptional()
  @IsString()
  explanation?: string;
}

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  languageId?: number;

  @IsOptional()
  @IsNumber()
  timeLimitMinutes?: number | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionItemDto)
  questions: QuizQuestionItemDto[];
}

export class ParseQuizDto {
  @IsOptional()
  @IsString()
  text?: string;
}

export class SubmitQuizDto {
  // Key là questionId hoặc order string, value là đáp án người làm chọn
  @IsNotEmpty()
  answers: Record<string, string>;

  @IsOptional()
  @IsNumber()
  conversationId?: number;
}

export class ExplainQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsString()
  @IsNotEmpty()
  correctAnswer: string;

  @IsOptional()
  @IsString()
  userAnswer?: string;
}

export class SaveFeedbackDto {
  @IsOptional()
  @IsString()
  feedback?: string;

  // Nhận xét từng câu: { questionId: "comment" }
  @IsOptional()
  questionFeedbacks?: Record<string, string>;
}
