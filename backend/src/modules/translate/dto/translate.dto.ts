import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const TRANSLATE_LANGS = ['auto', 'vi', 'en', 'ja', 'ko', 'zh', 'fr'] as const;

export class TranslateDto {
  @IsString()
  @IsNotEmpty({ message: 'Văn bản cần dịch không được để trống' })
  @MaxLength(1000)
  text!: string;

  @IsOptional()
  @IsIn(TRANSLATE_LANGS)
  source?: string;

  @IsIn(TRANSLATE_LANGS.filter((l) => l !== 'auto'))
  target!: string;
}
