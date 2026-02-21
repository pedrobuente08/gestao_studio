'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const {
    resendVerificationEmail,
    isResendVerificationLoading,
    resendVerificationSuccess,
    resendVerificationError,
  } = useAuth();

  const [countdown, setCountdown] = useState(0);

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
    if (email) resendVerificationEmail(email);
  };

  const getResendErrorMessage = (error: any) => {
    if (!error) return null;
    return error.response?.data?.message || 'Erro ao reenviar email. Tente novamente.';
  };

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
