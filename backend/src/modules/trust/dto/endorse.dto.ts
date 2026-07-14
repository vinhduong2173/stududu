import { EndorsementLabel } from '@prisma/client';
import { ArrayNotEmpty, IsArray, IsEnum, IsInt } from 'class-validator';

// FS-26 — 4 nhãn định tính cố định; BR-13: KHÔNG có điểm/rating
export class EndorseDto {
  @IsInt()
  receiverId!: number;

  @IsArray()
  @ArrayNotEmpty({ message: 'Cần chọn ít nhất 1 nhãn ghi nhận' })
  @IsEnum(EndorsementLabel, { each: true, message: 'Nhãn ghi nhận không hợp lệ' })
  labels!: EndorsementLabel[];
}
