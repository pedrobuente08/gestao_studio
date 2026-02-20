import { UserRole, TenantType } from '@prisma/client';

export class AuthUserResponse {
  id!: string;
  email!: string;
  name!: string;
  role!: UserRole;
  tenantId!: string;
  tenantType!: TenantType;
  mustChangePassword!: boolean;
}

export class AuthResponse {
  token!: string;
  user!: AuthUserResponse;
}
