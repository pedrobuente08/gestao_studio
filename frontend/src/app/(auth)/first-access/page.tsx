'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { AxiosError } from 'axios';

const schema = z
  .object({
    newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme sua senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

function FirstAccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (!token) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-rose-500">Tattoo Hub</h1>
          <p className="mt-2 text-content-secondary">Link inválido</p>
        </div>
        <div className="rounded-lg bg-red-500/10 p-4 text-center text-sm text-red-500">
          Este link de convite é inválido ou já foi utilizado.
        </div>
        <p className="text-center text-sm text-content-secondary">
          <Link href="/login" className="text-rose-500 hover:text-rose-400 transition-colors">
            Ir para o login
          </Link>
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-rose-500">Tattoo Hub</h1>
          <p className="mt-2 text-content-secondary">Conta ativada!</p>
        </div>
        <div className="rounded-lg bg-green-500/10 p-4 text-center text-sm text-green-500">
          Sua senha foi definida com sucesso. Agora você já pode fazer login.
        </div>
        <Button className="w-full" onClick={() => router.push('/login')}>
          Ir para o login
        </Button>
      </div>
    );
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/employees/first-access', {
        token,
        newPassword: data.newPassword,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || 'Erro ao ativar conta. Tente novamente.');
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-rose-500">Tattoo Hub</h1>
        <p className="mt-2 text-content-secondary">Defina sua senha de acesso</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-500/10 p-4 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        <Input
          label="Nova senha"
          type="password"
          placeholder="••••••••"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />

        <Input
          label="Confirmar senha"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Ativar minha conta
        </Button>
      </form>

      <p className="text-center text-sm text-content-secondary">
        <Link href="/login" className="text-rose-500 hover:text-rose-400 transition-colors">
          Já tenho acesso — fazer login
        </Link>
      </p>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-rose-500">Tattoo Hub</h1>
        <p className="mt-2 text-content-secondary">Carregando...</p>
      </div>
      <div className="flex justify-center">
        <svg
          className="h-8 w-8 animate-spin text-rose-500"
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

export default function FirstAccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <FirstAccessContent />
    </Suspense>
  );
}
