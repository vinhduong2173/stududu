import { IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { GroupPrivacy } from '@prisma/client';

export class UpdateGroupDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(GroupPrivacy)
  @IsOptional()
  privacy?: GroupPrivacy;

  @IsInt()
  @IsOptional()
  languageId?: number;

  @IsInt()
  @IsOptional()
  topicId?: number;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  coverUrl?: string;
}
