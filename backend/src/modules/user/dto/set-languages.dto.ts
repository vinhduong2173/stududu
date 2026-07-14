import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { LanguageRole } from '@prisma/client';

export class UserLanguageItemDto {
  @IsInt()
  languageId!: number;

  @IsEnum(LanguageRole)
  role!: LanguageRole;

  // learning: '1'–'5' · fluent: CEFR (A1–C2) · native: bỏ trống (US-04 AC2)
  @IsOptional()
  @IsString()
  level?: string;
}

export class SetLanguagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserLanguageItemDto)
  languages!: UserLanguageItemDto[];
}
