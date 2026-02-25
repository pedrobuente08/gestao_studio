import { UserRole, TenantType, UserStatus } from '@prisma/client';

export class StudioProfile {
  name?: string;
  cnpj?: string;
  address?: string;
  zipCode?: string;
  instagram?: string;
  phone?: string;
}

export class AuthUserResponse {
  id!: string;
  email!: string;
  name!: string;
  role!: UserRole;
  status!: UserStatus;
  tenantId?: string;
  tenantType?: TenantType;
  mustChangePassword!: boolean;
  birthDate?: string;
  gender?: string;
  instagram?: string;
  phone?: string;
  profilePhotoUrl?: string;
  studio?: StudioProfile;
}

export class AuthResponse {
  token!: string;
  user!: AuthUserResponse;
}
