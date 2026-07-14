import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: number; // user id
  role: UserRole;
}
