import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  // Cho phép URL http(s) hoặc data URL (ảnh chọn từ máy, đã nén phía client)
  @IsOptional()
  @Matches(/^(https?:\/\/|data:image\/)/, { message: 'Ảnh đại diện không hợp lệ' })
  @MaxLength(500_000, { message: 'Ảnh đại diện quá lớn' })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsString()
  intent?: string; // study buddy | thi cử | casual…

  @IsOptional()
  @IsIn(['nam', 'nữ', 'khác'], { message: 'Giới tính không hợp lệ' })
  gender?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  dob?: string; // ISO date — service chuyển sang Date

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  timezone?: string; // mã múi giờ (VN, UK, JP…) — hẹn lịch chat

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(2, { message: 'Chỉ chọn tối đa 2 khung giờ rảnh' })
  @IsString({ each: true })
  availableSlots?: string[]; // id khung giờ (s1..s6)

  @IsOptional()
  @IsBoolean()
  shareActivity?: boolean; // FS-25: tắt tạo activity post tự động trong Settings
}
