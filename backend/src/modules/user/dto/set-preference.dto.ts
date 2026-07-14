import { IsOptional, IsString } from 'class-validator';

export class SetPreferenceDto {
  @IsOptional()
  @IsString()
  intent?: string;

  @IsOptional()
  @IsString()
  languageFocus?: string;

  @IsOptional()
  @IsString()
  levelDesired?: string;
}
