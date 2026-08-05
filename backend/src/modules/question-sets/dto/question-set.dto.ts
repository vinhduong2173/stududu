import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { QuestionType, SetStatus } from '@prisma/client';

export class CreateQuestionSetDto {
  @IsInt()
  languageId!: number;

  @IsInt()
  topicId!: number;

  @IsString()
  @IsNotEmpty({ message: 'Khung trình độ không được để trống' })
  @MaxLength(20)
  framework!: string; // CEFR | HSK | JLPT | TOPIK

  @IsString()
  @IsNotEmpty({ message: 'Trình độ không được để trống' })
  @MaxLength(10)
  level!: string; // A1..C2

  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  contentLanguage?: string;
}

export class UpdateQuestionSetDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  framework?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  contentLanguage?: string;
}

export class QuestionPayloadDto {
  @IsEnum(QuestionType, { message: 'Loại câu hỏi không hợp lệ' })
  type!: QuestionType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  term?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  passage?: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung câu hỏi không được để trống' })
  @MaxLength(1000)
  prompt!: string;

  @IsArray()
  @ArrayMinSize(4, { message: 'Phải có đúng 4 đáp án' })
  @ArrayMaxSize(4, { message: 'Phải có đúng 4 đáp án' })
  @IsString({ each: true })
  options!: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  answerIndex!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  explanation?: string;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  term?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  passage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  prompt?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  answerIndex?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  explanation?: string;
}

/** Body multipart của POST /admin/question-sets/:id/generate (file đi kèm riêng) */
export class GenerateQuestionsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  questionCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

/** Nhập hàng loạt các câu đã đạt sau bước xem trước (dùng chung AI + nhập tay) */
export class ImportQuestionsDto {
  @IsArray()
  @Type(() => QuestionPayloadDto)
  questions!: QuestionPayloadDto[];

  @IsOptional()
  @IsBoolean()
  aiGenerated?: boolean;

  @IsOptional()
  sourceMeta?: Record<string, unknown>;
}

export class SubmitAttemptDto {
  @IsArray()
  answers!: { questionId: number; chosenIndex: number | null }[];
}

export class CreateChallengeDto {
  @IsInt()
  setId!: number;

  @IsString()
  @IsNotEmpty({ message: 'Tên thử thách không được để trống' })
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsDateString({}, { message: 'Thời gian bắt đầu không hợp lệ' })
  startsAt!: string;

  @IsDateString({}, { message: 'Thời gian kết thúc không hợp lệ' })
  endsAt!: string;
}

export class ListQuestionSetsQueryDto {
  @IsOptional()
  @IsEnum(SetStatus)
  status?: SetStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  languageId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  topicId?: number;

  @IsOptional()
  @IsString()
  level?: string;
}

export class VocabTopicDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên chủ đề không được để trống' })
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;
}
