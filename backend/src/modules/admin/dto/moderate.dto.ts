import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ModerationActionType } from '@prisma/client';

export class ModerateDto {
  @IsEnum(ModerationActionType)
  action!: ModerationActionType;

  @IsString()
  @IsNotEmpty({ message: 'Cần ghi rõ lý do xử lý' })
  reason!: string;
}
