'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { authClient } from '@/lib/auth-client';
import { RegisterData, StudioProfile } from '@/types/auth.types';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading, setUser, clearAuth } = useAuthStore();

  // Login com email e senha via Better Auth
  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });
      if (result.error) {
        throw Object.assign(new Error(result.error.message || 'Credenciais inválidas'), {
          code: result.error.code,
        });
      }
      // Busca campos customizados (tenantId, role, etc.) do nosso endpoint
      return authService.getMe();
    },
    onSuccess: (userData) => {
      setUser(userData);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/dashboard');
    },
  });

  // Registro (endpoint NestJS customizado para criar tenant com tenantType/tenantName)
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (_response, variables) => {
      router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`);
    },
  });

  // Solicitar reset de senha via endpoint Better Auth
  const requestPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      await axios.post(`${apiUrl}/api/auth/forget-password`, {
        email,
        redirectTo: `${appUrl}/reset-password`,
      });
    },
  });

  // Resetar senha via Better Auth
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
      const result = await authClient.resetPassword({ token, newPassword });
      if (result.error) throw new Error(result.error.message || 'Erro ao redefinir senha');
    },
    onSuccess: () => {
      router.push('/login');
    },
  });

  // Reenviar email de verificação (endpoint Better Auth direto)
  const resendVerificationMutation = useMutation({
    mutationFn: (email: string) => authService.resendVerificationEmail(email),
  });

  // Atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<any>) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(['user'], updatedUser);
    },
  });

  // Atualizar dados do tenant (STUDIO OWNER)
  const updateTenantMutation = useMutation({
    mutationFn: (data: Partial<StudioProfile>) => authService.updateTenant(data),
    onSuccess: (updatedStudio) => {
      if (user) {
        setUser({ ...user, studio: { ...user.studio, ...updatedStudio } });
      }
    },
  });

  // Trocar senha
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
  });

  // Upload de foto
  const uploadPhotoMutation = useMutation({
    mutationFn: (file: File) => authService.uploadPhoto(file),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(['user'], updatedUser);
    },
  });

  // Logout via Better Auth
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);

  const logout = async () => {
    setIsLogoutLoading(true);
    try {
      await authClient.signOut();
      clearAuth();
      queryClient.clear();
      router.push('/login');
    } finally {
      setIsLogoutLoading(false);
    }
  };

  // Login com Google via Better Auth
  const loginWithGoogle = () => {
    authClient.signIn.social({
      provider: 'google',
      callbackURL: `${appUrl}/oauth-callback`,
    });
  };

  return {
    // Estado
    user,
    isAuthenticated,
    isLoading,

    // Login
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoginLoading: loginMutation.isPending,

    // Registro
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    isRegisterLoading: registerMutation.isPending,

    // Reset de senha
    requestPasswordReset: requestPasswordResetMutation.mutate,
    requestPasswordResetAsync: requestPasswordResetMutation.mutateAsync,
    requestPasswordResetError: requestPasswordResetMutation.error,
    isRequestPasswordResetLoading: requestPasswordResetMutation.isPending,
    isRequestPasswordResetSuccess: requestPasswordResetMutation.isSuccess,

    resetPassword: resetPasswordMutation.mutate,
    resetPasswordAsync: resetPasswordMutation.mutateAsync,
    resetPasswordError: resetPasswordMutation.error,
    isResetPasswordLoading: resetPasswordMutation.isPending,

    // Verificação de email
    resendVerificationEmail: resendVerificationMutation.mutate,
    resendVerificationEmailAsync: resendVerificationMutation.mutateAsync,
    resendVerificationError: resendVerificationMutation.error,
    isResendVerificationLoading: resendVerificationMutation.isPending,
    resendVerificationSuccess: resendVerificationMutation.isSuccess,

    // Sessão
    logout,
    isLogoutLoading,
    loginWithGoogle,

    // Perfil
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdateProfileLoading: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,

    changePassword: changePasswordMutation.mutate,
    changePasswordAsync: changePasswordMutation.mutateAsync,
    isChangePasswordLoading: changePasswordMutation.isPending,
    changePasswordError: changePasswordMutation.error,

    uploadPhoto: uploadPhotoMutation.mutate,
    uploadPhotoAsync: uploadPhotoMutation.mutateAsync,
    isUploadPhotoLoading: uploadPhotoMutation.isPending,
    uploadPhotoError: uploadPhotoMutation.error,

    updateTenant: updateTenantMutation.mutate,
    updateTenantAsync: updateTenantMutation.mutateAsync,
    isUpdateTenantLoading: updateTenantMutation.isPending,
    updateTenantError: updateTenantMutation.error,
  };
}
