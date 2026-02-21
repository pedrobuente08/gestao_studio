import api from './api';
import axios from 'axios';
import { RegisterData, User } from '@/types/auth.types';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const authService = {
  async register(data: RegisterData): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/register', data);
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.patch<User>('/auth/me', data);
    return response.data;
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const response = await api.patch<{ message: string }>('/auth/me/password', data);
    return response.data;
  },

  async uploadPhoto(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<User>('/auth/me/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const response = await axios.post<{ message: string }>(
      `${apiUrl}/api/auth/send-verification-email`,
      { email },
    );
    return response.data;
  },
  
  async completeSocialRegistration(data: { tenantType: 'AUTONOMO' | 'STUDIO'; tenantName: string; city?: string; state?: string }): Promise<User> {
    const response = await api.post<User>('/auth/complete-social-registration', data);
    return response.data;
  },
};
