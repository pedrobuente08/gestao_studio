import { UserRole } from '@prisma/client';

export class AuthUserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
}

export class AuthResponse {
  token: string;
  user: AuthUserResponse;
}
