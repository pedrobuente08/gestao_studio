'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function VerifyEmailSuccessContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      setLoading(false);
      // pequeno delay para o fade-in após o loading sair
      setTimeout(() => setVisible(true), 50);
    }, 1200);
    return () => clearTimeout(loadTimer);
  }, []);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-rose-500">InkStudio</h1>
        <p className="mt-2 text-zinc-400">Verificação de email</p>
      </div>

      {loading ? (
        /* Estado 1: Loading */
        <div className="flex flex-col items-center gap-4 py-8">
          <svg
            className="h-12 w-12 text-rose-500 animate-spin"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-zinc-400 text-sm">Validando seu email...</p>
        </div>
      ) : error ? (
        /* Estado 3: Erro */
        <div
          className={`transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'} space-y-6`}
        >
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center space-y-5">
            <div className="flex justify-center">
              <div className="rounded-full bg-red-500/15 p-4">
                <svg
                  className="h-10 w-10 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-zinc-100 font-semibold text-lg">Link inválido ou expirado</p>
              <p className="text-sm text-zinc-400">
                O link de verificação é inválido ou já expirou. Tente fazer login novamente para receber um novo link.
              </p>
            </div>
          </div>
          <Link href="/login">
            <Button className="w-full">Voltar para o login</Button>
          </Link>
        </div>
      ) : (
        /* Estado 2: Sucesso */
        <div
          className={`transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'} space-y-6`}
        >
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center space-y-5">
            {/* Ícone de check */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="rounded-full bg-green-500/15 p-5">
                  <svg
                    className="h-12 w-12 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Texto */}
            <div className="space-y-1">
              <p className="text-zinc-100 font-semibold text-xl">Email validado!</p>
              <p className="text-sm text-zinc-400">
                Sua conta está ativa e pronta para uso.
              </p>
            </div>

            {/* Divisória */}
            <div className="border-t border-zinc-800" />

            {/* Info extra */}
            <p className="text-xs text-zinc-500">
              Faça login para acessar o sistema.
            </p>
          </div>

          <Link href="/login">
            <Button className="w-full">Ir para o login</Button>
          </Link>
        </div>
      )}
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

export default function VerifyEmailSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailSuccessContent />
    </Suspense>
  );
}
