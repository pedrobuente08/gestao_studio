'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RegisterData } from '@/types/auth.types';
import { AxiosError } from 'axios';

const registerSchema = z
  .object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme sua senha'),
    tenantType: z.enum(['AUTONOMO', 'STUDIO'], { message: 'Selecione o tipo de conta' }),
    tenantName: z.string().min(1, 'Campo obrigatório'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, isRegisterLoading, registerError } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      tenantType: 'AUTONOMO',
    },
  });

  const tenantType = watch('tenantType');

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerUser(registerData as RegisterData);
  };

  const getErrorMessage = (error: Error | null) => {
    if (!error) return null;
    if (error instanceof AxiosError) {
      return error.response?.data?.message || 'Erro ao criar conta. Tente novamente.';
    }
    return error.message || 'Erro ao criar conta. Tente novamente.';
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-rose-500">InkStudio</h1>
        <p className="mt-2 text-zinc-400">Crie sua conta</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {registerError && (
          <div className="rounded-lg bg-red-500/10 p-4 text-center text-sm text-red-500">
            {getErrorMessage(registerError)}
          </div>
        )}

        <Input
          label="Nome completo"
          type="text"
          placeholder="Seu nome"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirmar senha"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Tipo de conta
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 cursor-pointer hover:border-zinc-500 transition-colors">
              <input
                type="radio"
                value="AUTONOMO"
                className="h-4 w-4 text-rose-500 border-zinc-700 bg-zinc-800 focus:ring-rose-500 focus:ring-offset-zinc-900"
                {...register('tenantType')}
              />
              <span className="text-zinc-300">Autônomo</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 cursor-pointer hover:border-zinc-500 transition-colors">
              <input
                type="radio"
                value="STUDIO"
                className="h-4 w-4 text-rose-500 border-zinc-700 bg-zinc-800 focus:ring-rose-500 focus:ring-offset-zinc-900"
                {...register('tenantType')}
              />
              <span className="text-zinc-300">Estúdio</span>
            </label>
          </div>
          {errors.tenantType && (
            <p className="mt-1 text-sm text-red-500">{errors.tenantType.message}</p>
          )}
        </div>

        <Input
          label={tenantType === 'STUDIO' ? 'Nome do estúdio' : 'Seu nome profissional'}
          type="text"
          placeholder={
            tenantType === 'STUDIO'
              ? 'Nome do seu estúdio'
              : 'Como você é conhecido profissionalmente'
          }
          error={errors.tenantName?.message}
          {...register('tenantName')}
        />

        <Button type="submit" className="w-full" isLoading={isRegisterLoading}>
          Criar conta
        </Button>
      </form>

      <p className="text-center text-sm text-zinc-400">
        Já tem conta?{' '}
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
