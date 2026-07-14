import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// US-21 — quản lý danh mục LANGUAGE & TOPIC
export class CreateLanguageDto {
  @IsString()
  @IsNotEmpty({ message: 'Mã ngôn ngữ không được để trống' })
  code!: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên ngôn ngữ không được để trống' })
  name!: string;

  @IsOptional()
  @IsString()
  framework?: string;
}

export class UpdateLanguageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  code?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  framework?: string;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean; // US-21: ẩn khỏi hồ sơ & bộ lọc
}

export class CreateTopicDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên chủ đề không được để trống' })
  name!: string;
}

export class UpdateTopicDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Tên chủ đề không được để trống' })
  name?: string;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;
}
