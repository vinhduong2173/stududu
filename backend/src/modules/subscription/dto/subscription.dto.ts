import { IsNotEmpty, IsString, Matches } from 'class-validator';

/** Xác nhận thanh toán ở MockProvider — xem SRS §7.2 (bộ số thẻ test). */
export class ConfirmMockCheckoutDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @Matches(/^[\d\s]{12,25}$/, { message: 'cardNumber không hợp lệ' })
  cardNumber!: string;
}
