import { SavedWordSource } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SaveWordDto {
  @IsString()
  @IsNotEmpty({ message: 'Từ cần lưu không được để trống' })
  @MaxLength(100, { message: 'Từ tối đa 100 ký tự' })
  term!: string;

  @IsInt()
  languageId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  personalNote?: string;

  @IsEnum(SavedWordSource, { message: 'source phải là chat hoặc manual' })
  source!: SavedWordSource;
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
