'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const ESTADOS_BR = [
  { value: 'AC', label: 'AC — Acre' },
  { value: 'AL', label: 'AL — Alagoas' },
  { value: 'AP', label: 'AP — Amapá' },
  { value: 'AM', label: 'AM — Amazonas' },
  { value: 'BA', label: 'BA — Bahia' },
  { value: 'CE', label: 'CE — Ceará' },
  { value: 'DF', label: 'DF — Distrito Federal' },
  { value: 'ES', label: 'ES — Espírito Santo' },
  { value: 'GO', label: 'GO — Goiás' },
  { value: 'MA', label: 'MA — Maranhão' },
  { value: 'MT', label: 'MT — Mato Grosso' },
  { value: 'MS', label: 'MS — Mato Grosso do Sul' },
  { value: 'MG', label: 'MG — Minas Gerais' },
  { value: 'PA', label: 'PA — Pará' },
  { value: 'PB', label: 'PB — Paraíba' },
  { value: 'PR', label: 'PR — Paraná' },
  { value: 'PE', label: 'PE — Pernambuco' },
  { value: 'PI', label: 'PI — Piauí' },
  { value: 'RJ', label: 'RJ — Rio de Janeiro' },
  { value: 'RN', label: 'RN — Rio Grande do Norte' },
  { value: 'RS', label: 'RS — Rio Grande do Sul' },
  { value: 'RO', label: 'RO — Rondônia' },
  { value: 'RR', label: 'RR — Roraima' },
  { value: 'SC', label: 'SC — Santa Catarina' },
  { value: 'SP', label: 'SP — São Paulo' },
  { value: 'SE', label: 'SE — Sergipe' },
  { value: 'TO', label: 'TO — Tocantins' },
];

const schema = z.object({
  tenantName: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  tenantType: z.enum(['AUTONOMO', 'STUDIO'] as const),
  city: z.string().min(2, 'Informe a cidade').optional().or(z.literal('')),
  state: z.string().min(2, 'Selecione o estado').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const { user, setUser, isLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tenantType: 'AUTONOMO',
      city: '',
      state: '',
    },
  });

  const tenantType = watch('tenantType');

  useEffect(() => {
    // Só redireciona se o usuário está completamente configurado (tem tenant)
    if (!isLoading && user && user.tenantId) {
      router.replace('/dashboard');
    }
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await authService.completeSocialRegistration({
        tenantType: data.tenantType,
        tenantName: data.tenantName,
        city: data.city || undefined,
        state: data.state || undefined,
      });
      // Busca o usuário completo (com tenantType, role, etc.) após criar o tenant
      const enrichedUser = await authService.getMe();
      setUser(enrichedUser);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao finalizar cadastro');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || (user && user.tenantId)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card
          title="Finalizar Cadastro"
          description="Falta pouco! Precisamos de algumas informações para configurar seu espaço."
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-4 text-center text-sm text-red-500">
                {error}
              </div>
            )}

            {/* Tipo de Conta — PRIMEIRO */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Tipo de Conta
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 cursor-pointer hover:border-zinc-500 transition-colors flex-1">
                  <input
                    type="radio"
                    value="AUTONOMO"
                    className="h-4 w-4 text-rose-500 border-zinc-700 bg-zinc-800 focus:ring-rose-500 focus:ring-offset-zinc-900"
                    {...register('tenantType')}
                  />
                  <span className="text-zinc-300">Autônomo</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 cursor-pointer hover:border-zinc-500 transition-colors flex-1">
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
              label={tenantType === 'STUDIO' ? 'Nome do Estúdio / Empresa' : 'Seu nome profissional'}
              id="tenantName"
              placeholder={tenantType === 'STUDIO' ? 'Ex: My Ink Studio' : 'Ex: João Tattoo'}
              error={errors.tenantName?.message}
              {...register('tenantName')}
            />

            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  label="Cidade"
                  id="city"
                  placeholder="Ex: São Paulo"
                  error={errors.city?.message}
                  {...register('city')}
                />
              </div>
              <div className="w-28">
                <label className="mb-1 block text-sm font-medium text-zinc-300">Estado</label>
                <select
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 h-[42px]"
                  {...register('state')}
                >
                  <option value="">UF</option>
                  {ESTADOS_BR.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              isLoading={isSubmitting}
            >
              Concluir Configuração
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
