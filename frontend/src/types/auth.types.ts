export interface StudioProfile {
  name?: string;
  cnpj?: string;
  address?: string;
  zipCode?: string;
  instagram?: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'STAFF' | 'EMPLOYEE';
  tenantId?: string;
  tenantType?: 'AUTONOMO' | 'STUDIO';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING_SETUP';
  mustChangePassword: boolean;
  birthDate?: string;
  gender?: string;
  instagram?: string;
  phone?: string;
  profilePhotoUrl?: string;
  studio?: StudioProfile;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  tenantType: 'AUTONOMO' | 'STUDIO';
  tenantName: string;
  city?: string;
  state?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email?: string;
  token?: string;
  newPassword?: string;
}
