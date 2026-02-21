'use client';

import { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AxiosError } from 'axios';

const requestResetSchema = z.object({
  email: z.string().email('Email inválido'),
});

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme sua senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

type RequestResetFormData = z.infer<typeof requestResetSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const {
    requestPasswordReset,
    isRequestPasswordResetLoading,
    isRequestPasswordResetSuccess,
    requestPasswordResetError,
    resetPassword,
    isResetPasswordLoading,
    resetPasswordError,
  } = useAuth();

  const requestForm = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onRequestReset = (data: RequestResetFormData) => {
    requestPasswordReset(data.email);
  };

  const onResetPassword = (data: ResetPasswordFormData) => {
    if (token) {
      resetPassword({ token, newPassword: data.newPassword });
    }
  };

  const getErrorMessage = (error: Error | null) => {
    if (!error) return null;
    if (error instanceof AxiosError) {
      return error.response?.data?.message || 'Erro. Tente novamente.';
    }
    return error.message || 'Erro. Tente novamente.';
  };

  // Formulário de nova senha (com token)
  if (token) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-rose-500">InkStudio</h1>
          <p className="mt-2 text-zinc-400">Defina sua nova senha</p>
        </div>

        <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-6">
          {resetPasswordError && (
            <div className="rounded-lg bg-red-500/10 p-4 text-center text-sm text-red-500">
              {getErrorMessage(resetPasswordError)}
            </div>
          )}

          <Input
            label="Nova senha"
            type="password"
            placeholder="••••••••"
            error={resetForm.formState.errors.newPassword?.message}
            {...resetForm.register('newPassword')}
          />

          <Input
            label="Confirmar nova senha"
            type="password"
            placeholder="••••••••"
            error={resetForm.formState.errors.confirmPassword?.message}
            {...resetForm.register('confirmPassword')}
          />

          <Button type="submit" className="w-full" isLoading={isResetPasswordLoading}>
            Redefinir senha
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          <Link
            href="/login"
            className="text-rose-500 hover:text-rose-400 transition-colors"
          >
            Voltar para o login
          </Link>
        </p>
      </div>
    );
  }

  // Formulário de solicitar reset (sem token)
  if (isRequestPasswordResetSuccess) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-rose-500">InkStudio</h1>
          <p className="mt-2 text-zinc-400">Email enviado!</p>
        </div>
        <div className="rounded-lg bg-green-500/10 p-4 text-center text-sm text-green-500">
          Enviamos um link de recuperação para o seu email. Verifique sua caixa de entrada
          e spam.
        </div>
        <p className="text-center text-sm text-zinc-400">
          <Link
            href="/login"
            className="text-rose-500 hover:text-rose-400 transition-colors"
          >
            Voltar para o login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-rose-500">InkStudio</h1>
        <p className="mt-2 text-zinc-400">Recuperar senha</p>
      </div>

      <form onSubmit={requestForm.handleSubmit(onRequestReset)} className="space-y-6">
        {requestPasswordResetError && (
          <div className="rounded-lg bg-red-500/10 p-4 text-center text-sm text-red-500">
            {getErrorMessage(requestPasswordResetError)}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          error={requestForm.formState.errors.email?.message}
          {...requestForm.register('email')}
        />

        <Button type="submit" className="w-full" isLoading={isRequestPasswordResetLoading}>
          Enviar link de recuperação
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-400">
        Lembrou sua senha?{' '}
        <Link
          href="/login"
          className="text-rose-500 hover:text-rose-400 transition-colors"
        >
          Faça login
        </Link>
      </p>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-rose-500">InkStudio</h1>
        <p className="mt-2 text-zinc-400">Carregando...</p>
      </div>
      <div className="flex justify-center">
        <svg
          className="h-8 w-8 animate-spin text-rose-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
