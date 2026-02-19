'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const { setAuth } = useAuthStore();
  const {
    resendVerificationEmail,
    isResendVerificationLoading,
    resendVerificationSuccess,
    resendVerificationError,
  } = useAuth();

  const [verifyState, setVerifyState] = useState<'loading' | 'success' | 'error' | null>(
    token ? 'loading' : null,
  );
  const [errorMessage, setErrorMessage] = useState('');

  // Verifica o token ao montar o componente
  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const response = await authService.verifyEmail(token);
        if ('token' in response && 'user' in response) {
          const authResponse = response as { token: string; user: any };
          setAuth(authResponse.token, authResponse.user);
          setVerifyState('success');
          setTimeout(() => router.push('/dashboard'), 1500);
        } else {
          setVerifyState('error');
          setErrorMessage('Não foi possível verificar o email. Tente novamente.');
        }
      } catch (err: any) {
        setVerifyState('error');
        setErrorMessage(
          err?.response?.data?.message || 'Token inválido ou expirado.',
        );
      }
    };

    verify();
  }, [token, router, setAuth]);

  const [countdown, setCountdown] = useState(0);

  // Inicia o contador somente após o sucesso do reenvio
  useEffect(() => {
    if (resendVerificationSuccess) {
      setCountdown(60);
    }
  }, [resendVerificationSuccess]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = () => {
    if (email) {
      resendVerificationEmail(email);
    }
  };

  const getResendErrorMessage = (error: any) => {
    if (!error) return null;
    return error.response?.data?.message || 'Erro ao reenviar email. Tente novamente.';
  };

  // ── Estado B: verificando com token ──────────────────────────────────────

  if (token && verifyState === 'loading') {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-rose-500">InkStudio</h1>
          <p className="mt-2 text-zinc-400">Verificando seu email...</p>
        </div>
        <div className="flex justify-center">
          <svg
            className="h-10 w-10 animate-spin text-rose-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
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

  if (token && verifyState === 'success') {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-rose-500">InkStudio</h1>
          <p className="mt-2 text-zinc-400">Email verificado!</p>
        </div>
        <div className="rounded-lg bg-green-500/10 p-6 text-center">
          <div className="flex justify-center mb-3">
            <svg className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-green-400 font-medium">Email verificado com sucesso!</p>
          <p className="text-sm text-zinc-400 mt-1">Redirecionando para o dashboard...</p>
        </div>
      </div>
    );
  }

  if (token && verifyState === 'error') {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-rose-500">InkStudio</h1>
          <p className="mt-2 text-zinc-400">Link inválido</p>
        </div>
        <div className="rounded-lg bg-red-500/10 p-4 text-center text-sm text-red-400">
          {errorMessage}
        </div>
        <Link href="/verify-email">
          <Button className="w-full">Solicitar novo email de verificação</Button>
        </Link>
        <p className="text-center text-sm text-zinc-400">
          <Link href="/login" className="text-rose-500 hover:text-rose-400 transition-colors">
            Voltar para o login
          </Link>
        </p>
      </div>
    );
  }

  // ── Estado A: aguardando verificação (sem token) ──────────────────────────

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-rose-500">InkStudio</h1>
        <p className="mt-2 text-zinc-400">Verifique seu email</p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center space-y-4">
        <div className="flex justify-center">
          <svg className="h-14 w-14 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <p className="text-zinc-100 font-medium">Email de verificação enviado!</p>
          {email && (
            <p className="text-sm text-zinc-400 mt-1">
              Enviamos um link para <span className="text-zinc-200">{email}</span>
            </p>
          )}
          {!email && (
            <p className="text-sm text-zinc-400 mt-1">
              Verifique sua caixa de entrada e clique no link enviado.
            </p>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          Não esqueça de verificar a pasta de spam.
        </p>
      </div>

      {resendVerificationError && (
        <div className="rounded-lg bg-red-500/10 p-4 text-center text-sm text-red-500">
          {getResendErrorMessage(resendVerificationError)}
        </div>
      )}

      {resendVerificationSuccess ? (
        <div className="rounded-lg bg-green-500/10 p-4 text-center text-sm text-green-400">
          Email reenviado com sucesso! Verifique sua caixa de entrada.
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResend}
          isLoading={isResendVerificationLoading}
          disabled={!email || countdown > 0}
        >
          {countdown > 0 ? `Aguarde ${countdown}s para reenviar` : 'Reenviar email de verificação'}
        </Button>
      )}

      <p className="text-center text-sm text-zinc-400">
        <Link href="/login" className="text-rose-500 hover:text-rose-400 transition-colors">
          Voltar para o login
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
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
