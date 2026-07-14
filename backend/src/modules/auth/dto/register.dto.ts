import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  // US-01 (đã chốt): ≥8 ký tự, gồm cả chữ và số
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải gồm cả chữ và số',
  })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên hiển thị không được để trống' })
  displayName!: string;
}
