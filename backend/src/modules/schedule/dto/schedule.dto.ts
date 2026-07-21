import { IsDateString, IsIn, IsInt } from 'class-validator';

export class CreateScheduleDto {
  @IsInt()
  conversationId!: number;

  // BR-15 — luôn nhận & lưu UTC (ISO string); FE convert theo timezone trình duyệt
  @IsDateString({}, { message: 'Thời gian hẹn không hợp lệ' })
  proposedTimeUtc!: string;
}

export class RespondScheduleDto {
  @IsIn(['accept', 'decline'], { message: 'action phải là accept hoặc decline' })
  action!: 'accept' | 'decline';
}
