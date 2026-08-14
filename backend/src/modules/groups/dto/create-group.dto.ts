import { IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { GroupPrivacy } from '@prisma/client';

export class CreateGroupDto {
  @IsString()
  @MinLength(3, { message: 'Tên nhóm tối thiểu 3 ký tự' })
  @MaxLength(100, { message: 'Tên nhóm tối đa 100 ký tự' })
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000, { message: 'Mô tả nhóm tối đa 1000 ký tự' })
  description?: string;

  @IsEnum(GroupPrivacy, { message: 'Quyền riêng tư không hợp lệ' })
  @IsOptional()
  privacy?: GroupPrivacy = GroupPrivacy.public;

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
