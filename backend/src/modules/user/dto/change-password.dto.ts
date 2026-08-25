import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  // Cùng chuẩn BR-01: ≥8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]).+$/,
    {
      message:
        'Mật khẩu phải gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt',
    },
  )
  newPassword!: string;
}
