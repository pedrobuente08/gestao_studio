'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { LoginData, RegisterData } from '@/types/auth.types';
import { useEffect } from 'react';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, isAuthenticated, isLoading, setAuth, clearAuth, setUser, setLoading } =
    useAuthStore();

  // Query para buscar dados do usuário quando há token
  const { isLoading: isLoadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const userData = await authService.getMe();
      setUser(userData);
      setLoading(false);
      return userData;
    },
    enabled: !!token && !user,
    retry: false,
  });

  // Mutation de login
  const loginMutation = useMutation({
    mutationFn: (data: LoginData) => authService.login(data),
    onSuccess: (response) => {
      setAuth(response.token, response.user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/dashboard');
    },
  });

  // Mutation de registro
  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (_response, variables) => {
      // Após registro, redireciona para verificação de email
      router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`);
    },
  });

  // Mutation de solicitar reset de senha
  const requestPasswordResetMutation = useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
  });

  // Mutation de resetar senha
  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(token, newPassword),
    onSuccess: () => {
      router.push('/login');
    },
  });

  // Mutation de verificar email
  const verifyEmailMutation = useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
  });

  // Mutation de reenviar email de verificação
  const resendVerificationMutation = useMutation({
    mutationFn: (email: string) => authService.resendVerificationEmail(email),
  });

  // Mutation de atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<any>) => authService.updateProfile(data),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(['user'], updatedUser);
    },
  });

  // Mutation de trocar senha
  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => authService.changePassword(data),
  });

  // Mutation de upload de foto
  const uploadPhotoMutation = useMutation({
    mutationFn: (file: File) => authService.uploadPhoto(file),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(['user'], updatedUser);
    },
  });

  // Função de logout
  const logout = () => {
    clearAuth();
    queryClient.clear();
    router.push('/login');
  };

  // Função de login com Google
  const loginWithGoogle = () => {
    authService.loginWithGoogle();
  };

  return {
    // Estado
    user,
    isAuthenticated,
    isLoading: isLoading || isLoadingUser,

    // Actions
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    isLoginLoading: loginMutation.isPending,

    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    isRegisterLoading: registerMutation.isPending,

    requestPasswordReset: requestPasswordResetMutation.mutate,
    requestPasswordResetAsync: requestPasswordResetMutation.mutateAsync,
    requestPasswordResetError: requestPasswordResetMutation.error,
    isRequestPasswordResetLoading: requestPasswordResetMutation.isPending,
    isRequestPasswordResetSuccess: requestPasswordResetMutation.isSuccess,

    resetPassword: resetPasswordMutation.mutate,
    resetPasswordAsync: resetPasswordMutation.mutateAsync,
    resetPasswordError: resetPasswordMutation.error,
    isResetPasswordLoading: resetPasswordMutation.isPending,

    verifyEmail: verifyEmailMutation.mutate,
    verifyEmailAsync: verifyEmailMutation.mutateAsync,
    verifyEmailError: verifyEmailMutation.error,
    isVerifyEmailLoading: verifyEmailMutation.isPending,

    resendVerificationEmail: resendVerificationMutation.mutate,
    resendVerificationEmailAsync: resendVerificationMutation.mutateAsync,
    resendVerificationError: resendVerificationMutation.error,
    isResendVerificationLoading: resendVerificationMutation.isPending,
    resendVerificationSuccess: resendVerificationMutation.isSuccess,

    logout,
    loginWithGoogle,

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
  };
}
