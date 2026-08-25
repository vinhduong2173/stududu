import { IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinGroupDto {
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Lời nhắn không quá 255 ký tự' })
  message?: string;
}
