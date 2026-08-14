import { IsEnum } from 'class-validator';

export class ReviewRequestDto {
  @IsEnum(['approve', 'reject'] as const)
  action!: 'approve' | 'reject';
}
