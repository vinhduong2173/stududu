import { SavedWordSource } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveWordDto {
  @IsString()
  @IsNotEmpty({ message: 'Từ cần lưu không được để trống' })
  @MaxLength(100, { message: 'Từ tối đa 100 ký tự' })
  term!: string;

  @IsOptional()
  @IsInt()
  languageId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  phonetic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  partOfSpeech?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  definition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  example?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  audioUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  personalNote?: string;

  @IsEnum(SavedWordSource, { message: 'source phải là chat hoặc manual' })
  source!: SavedWordSource;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateWordStatusDto {
  @IsString()
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  status!: string;
}

export class UpdateLibraryWordDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  definition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  example?: string;
}
