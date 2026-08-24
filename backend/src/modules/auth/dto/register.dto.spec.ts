import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto Password Validation', () => {
  const baseDto = {
    email: 'test@example.com',
  };

  it('should pass validation with a strong password (uppercase, lowercase, number, special char, >=8)', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...baseDto,
      password: 'StrongPassword123!',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when password is shorter than 8 characters', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...baseDto,
      password: 'Aa1!',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const passwordErrors = errors.find((e) => e.property === 'password');
    expect(passwordErrors).toBeDefined();
  });

  it('should fail validation when password lacks uppercase letters', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...baseDto,
      password: 'weakpassword123!',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const passwordErrors = errors.find((e) => e.property === 'password');
    expect(passwordErrors).toBeDefined();
    expect(passwordErrors?.constraints?.matches).toBeDefined();
  });

  it('should fail validation when password lacks lowercase letters', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...baseDto,
      password: 'STRONGPASSWORD123!',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const passwordErrors = errors.find((e) => e.property === 'password');
    expect(passwordErrors).toBeDefined();
    expect(passwordErrors?.constraints?.matches).toBeDefined();
  });

  it('should fail validation when password lacks numbers', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...baseDto,
      password: 'StrongPassword!!!',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const passwordErrors = errors.find((e) => e.property === 'password');
    expect(passwordErrors).toBeDefined();
    expect(passwordErrors?.constraints?.matches).toBeDefined();
  });

  it('should fail validation when password lacks special characters', async () => {
    const dto = plainToInstance(RegisterDto, {
      ...baseDto,
      password: 'StrongPassword123',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const passwordErrors = errors.find((e) => e.property === 'password');
    expect(passwordErrors).toBeDefined();
    expect(passwordErrors?.constraints?.matches).toBeDefined();
  });
});
