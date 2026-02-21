'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTenant } from '@/hooks/use-tenant';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Building2, Percent, Save, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { PageOverlay } from '@/components/ui/page-loader';
import { useAuth } from '@/hooks/use-auth';

const tenantSchema = z.object({
  name: z.string().min(3, 'Nome do estúdio deve ter no mínimo 3 caracteres'),
});

const configSchema = z.object({
  defaultPercentage: z.coerce.number().min(0).max(100, 'Porcentagem deve ser entre 0 e 100'),
});

export default function SettingsPage() {
  const { user } = useAuth();
  const { tenant, config, updateTenant, updateConfig, isUpdating, isLoading } = useTenant();

  const tenantForm = useForm({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
    },
  });

  const configForm = useForm({
    resolver: zodResolver(configSchema),
    defaultValues: {
      defaultPercentage: 50,
    },
  });

  useEffect(() => {
    if (tenant) {
      tenantForm.reset({ name: tenant.name });
    }
  }, [tenant, tenantForm]);

  useEffect(() => {
    if (config) {
      configForm.reset({ defaultPercentage: config.defaultPercentage });
    }
  }, [config, configForm]);

  const handleTenantSubmit = (data: { name: string }) => {
    updateTenant(data);
  };

  const handleConfigSubmit = (data: { defaultPercentage: number }) => {
    updateConfig(data.defaultPercentage);
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageOverlay show={isUpdating} />
      
      <PageHeader
        title="Configurações do Estúdio"
        description="Gerencie as informações básicas e regras de negócio do seu estúdio"
      />

      <div className="grid gap-8 max-w-4xl">
        {/* Perfil do Estúdio */}
        <Card title="Perfil do Estúdio" description="Informações públicas do seu estabelecimento">
          <form onSubmit={tenantForm.handleSubmit(handleTenantSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Nome do Estúdio</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  {...tenantForm.register('name')}
                  className="pl-10"
                  placeholder="Ex: Ink Tattoo Studio"
                />
              </div>
              {tenantForm.formState.errors.name && (
                <p className="text-sm text-rose-500">{tenantForm.formState.errors.name.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdating}>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Card>

        {/* Regras de Negócio (apenas STUDIO) */}
        {user?.tenantType === 'STUDIO' && (
          <Card title="Regras de Negócio" description="Configure as porcentagens padrão para cálculos">
            <form onSubmit={configForm.handleSubmit(handleConfigSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Porcentagem Padrão do Estúdio (%)</label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input
                    type="number"
                    {...configForm.register('defaultPercentage')}
                    className="pl-10"
                    placeholder="Ex: 50"
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  Esta porcentagem será usada como padrão ao criar novos procedimentos.
                </p>
                {configForm.formState.errors.defaultPercentage && (
                  <p className="text-sm text-rose-500">{configForm.formState.errors.defaultPercentage.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdating}>
                  <Save className="mr-2 h-4 w-4" />
                  Atualizar Regras
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
