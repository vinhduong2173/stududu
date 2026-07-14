import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReportDto {
  @IsInt()
  reportedId!: number; // luôn là user (chủ nội dung khi report post/word)

  @IsString()
  @IsNotEmpty({ message: 'Cần chọn lý do report' })
  reason!: string;

  // FS-24/25 — report nội dung: post cộng đồng hoặc mục trong thư viện từ
  @IsOptional()
  @IsIn(['post', 'word_library'])
  targetType?: string;

  @IsOptional()
  @IsInt()
  targetId?: number;
}
