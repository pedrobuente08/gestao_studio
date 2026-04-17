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

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const registerSchema = z
  .object({
    // tenantType: z.enum(['AUTONOMO', 'STUDIO'], { message: 'Selecione o tipo de conta' }), // TODO: reabilitar STUDIO
    tenantType: z.enum(['AUTONOMO']),
    tenantName: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => data.tenantType === 'AUTONOMO' || (data.tenantName && data.tenantName.length >= 1),
    { message: 'Campo obrigatório', path: ['tenantName'] },
  )
  // TODO: reabilitar STUDIO — .refine((data) => data.tenantType === 'STUDIO' || (data.name && data.name.length >= 3), { message: 'Nome deve ter no mínimo 3 caracteres', path: ['name'] })
  .refine((data) => data.name && data.name.length >= 3, { message: 'Nome deve ter no mínimo 3 caracteres', path: ['name'] });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser, isRegisterLoading, registerError } = useAuth();

  const {
    register,
    handleSubmit,
    // watch, // TODO: reabilitar quando STUDIO for liberado
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      tenantType: 'AUTONOMO',
    },
  });

  // TODO: reabilitar quando STUDIO for liberado — const tenantType = watch('tenantType');

  const onSubmit = (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    // TODO: reabilitar STUDIO — if (data.tenantType === 'STUDIO') { registerData.name = data.tenantName; } else { ... }
    registerData.tenantName = data.name;
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
        <h1 className="text-3xl font-bold text-rose-500">Tattoo Hub</h1>
        <p className="mt-2 text-content-secondary">Crie sua conta</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {registerError && (
          <div className="rounded-lg bg-red-500/10 p-4 text-center text-sm text-red-500">
            {getErrorMessage(registerError)}
          </div>
        )}

        {/* TODO: reabilitar seleção de tipo de conta quando STUDIO for liberado
        <div>
          <label className="mb-2 block text-sm font-medium text-content-primary">Tipo de conta</label>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-edge-muted cursor-pointer hover:border-edge transition-colors flex-1">
              <input type="radio" value="AUTONOMO" className="h-4 w-4 text-rose-500 border-edge-muted bg-surface-elevated focus:ring-rose-500 focus:ring-offset-surface-card" {...register('tenantType')} />
              <span className="text-content-primary">Autônomo</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-edge-muted cursor-pointer hover:border-edge transition-colors flex-1">
              <input type="radio" value="STUDIO" className="h-4 w-4 text-rose-500 border-edge-muted bg-surface-elevated focus:ring-rose-500 focus:ring-offset-surface-card" {...register('tenantType')} />
              <span className="text-content-primary">Estúdio</span>
            </label>
          </div>
        </div>
        {tenantType === 'STUDIO' && (
          <Input label="Nome do estúdio" type="text" placeholder="Nome do seu estúdio" error={errors.tenantName?.message} {...register('tenantName')} />
        )}
        */}

        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Cidade"
              type="text"
              placeholder="Sua cidade"
              error={errors.city?.message}
              {...register('city')}
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-sm font-medium text-content-primary">Estado</label>
            <select
              className="w-full rounded-lg border border-edge-muted bg-surface-elevated px-3 py-2 text-sm text-content-primary focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 h-[42px]"
              {...register('state')}
            >
              <option value="">UF</option>
              {ESTADOS_BR.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TODO: reabilitar quando STUDIO for liberado — {tenantType !== 'STUDIO' && ( ... )} */}
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

        <Button type="submit" className="w-full" isLoading={isRegisterLoading}>
          Criar conta
        </Button>
      </form>

      <p className="text-center text-sm text-content-secondary">
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
