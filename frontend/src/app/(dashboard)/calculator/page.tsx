'use client';

import { useState } from 'react';
import { useCalculator } from '@/hooks/use-calculator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatCurrency } from '@/utils/format-currency';
import {
  Plus,
  Trash2,
  Settings2,
  Calculator,
  Building2,
  Home,
} from 'lucide-react';
import { useForm }
from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalculatorMode } from '@/types/calculator.types';
import { Skeleton } from '@/components/ui/skeleton';
import { PageOverlay } from '@/components/ui/page-loader';
import { PageHeader } from '@/components/ui/page-header';

const settingsSchema = z.object({
  hoursPerMonth: z.coerce.number().min(1, 'Mínimo de 1 hora'),
  profitMargin: z.coerce.number().min(0).max(100, 'Margem entre 0 e 100%'),
  studioPercentage: z.coerce.number().min(0).max(100).optional(),
});

const costSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  amount: z.coerce.number().min(0.01, 'Valor deve ser maior que 0'),
});

type SettingsFormData = z.infer<typeof settingsSchema>;
type CostFormData = z.infer<typeof costSchema>;

export default function CalculatorPage() {
  const {
    result: data,
    isLoading,
    addCost,
    removeCost,
    setWorkSettings,
    isAddingCost,
    isSettingWorkSettings,
  } = useCalculator();

  const [simHours, setSimHours] = useState(2);
  const [simComplexity, setSimComplexity] = useState(1.2);
  const [desiredNet, setDesiredNet] = useState(0);
  const [optimisticMode, setOptimisticMode] = useState<CalculatorMode | null>(null);

  const mode: CalculatorMode = optimisticMode ?? data?.mode ?? 'AUTONOMOUS';
  const isStudioMode = mode === 'STUDIO_PERCENTAGE';

  const settingsForm = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema) as any,
  });

  const costForm = useForm<CostFormData>({
    resolver: zodResolver(costSchema) as any,
  });

  // Cálculos do simulador
  const minPerHour = data?.minimumPricePerHour || 0;
  const totalVariableCents = data?.totalVariable || 0;

  // Modo autônomo: preço baseado em custo por hora + complexidade + materiais
  const simResultAutonomo = Math.round(minPerHour * simHours * simComplexity) + totalVariableCents;

  // Modo studio: quanto cobrar para ter lucro líquido desejado
  const studioPct = (data?.studioPercentage || 0) / 100;
  const neededPriceForDesiredNet =
    studioPct < 1
      ? Math.round((desiredNet * 100 + totalVariableCents) / (1 - studioPct))
      : 0;

  const handleAddCost = (type: 'fixed' | 'variable') => (formData: CostFormData) => {
    addCost({ data: { ...formData, type }, type });
    costForm.reset();
  };

  const handleUpdateSettings = (formData: SettingsFormData) => {
    setWorkSettings({
      hoursPerMonth: formData.hoursPerMonth,
      profitMargin: formData.profitMargin,
      mode,
      studioPercentage: formData.studioPercentage,
    });
  };

  const handleSwitchMode = (newMode: CalculatorMode) => {
    if (isSettingWorkSettings) return;
    setOptimisticMode(newMode);
    setWorkSettings(
      {
        hoursPerMonth: data?.hoursPerMonth || 160,
        profitMargin: data?.profitMargin || 30,
        mode: newMode,
        studioPercentage: data?.studioPercentage ?? undefined,
      },
      {
        onSettled: () => setOptimisticMode(null),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="flex gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-[400px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 relative">
      {isSettingWorkSettings && <PageOverlay show={isSettingWorkSettings || isAddingCost} />}
      <PageHeader
        title="Calculadora de Custos"
        description="Entenda seus custos e defina preços lucrativos"
      />

      {/* Toggle de Modo */}
      <div className="flex gap-3">
        <button
          onClick={() => handleSwitchMode('AUTONOMOUS')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium border transition-all ${
            !isStudioMode
              ? 'bg-rose-500/10 border-rose-500 text-rose-500'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
          }`}
        >
          <Home className="h-4 w-4" />
          Tenho meu próprio espaço
        </button>
        <button
          onClick={() => handleSwitchMode('STUDIO_PERCENTAGE')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium border transition-all ${
            isStudioMode
              ? 'bg-rose-500/10 border-rose-500 text-rose-500'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
          }`}
        >
          <Building2 className="h-4 w-4" />
          Trabalho em studio (pago percentual)
        </button>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Coluna da Esquerda: Custos */}
        <div className="lg:col-span-2 space-y-8">
          {/* Custos Fixos — só no modo autônomo */}
          {!isStudioMode && (
            <Card title="Custos Fixos Mensais" description="Aluguel, luz, internet, etc.">
              <div className="space-y-6">
                <form
                  onSubmit={costForm.handleSubmit((d) => handleAddCost('fixed')(d as CostFormData))}
                  className="flex gap-3 items-end"
                >
                  <div className="flex-1">
                    <Input
                      label="Novo Custo Fixo"
                      placeholder="Ex: Aluguel"
                      {...costForm.register('name')}
                    />
                  </div>
                  <div className="w-32 sm:w-48">
                    <Input
                      label="Valor (R$)"
                      type="number"
                      step="0.01"
                      placeholder="200,00"
                      {...costForm.register('amount')}
                    />
                  </div>
                  <Button type="submit" size="sm" className="mb-0.5" isLoading={isAddingCost}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.fixedCosts.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell>{cost.name}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(cost.amount)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeCost({ id: cost.id, type: 'fixed' })}>
                            <Trash2 className="h-4 w-4 text-zinc-500 hover:text-rose-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {data?.fixedCosts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-zinc-500 text-xs italic">
                          Nenhum custo fixo cadastrado
                        </TableCell>
                      </TableRow>
                    )}
                    {(data?.fixedCosts.length ?? 0) > 0 && (
                      <TableRow className="border-t border-zinc-700">
                        <TableCell className="font-bold text-zinc-300">Total</TableCell>
                        <TableCell className="text-right font-bold text-zinc-100">{formatCurrency(data?.totalFixed || 0)}</TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* Custos Variáveis — sempre visível */}
          <Card title="Custos Variáveis por Atendimento" description="Materiais, transporte, descartáveis, etc.">
            <div className="space-y-6">
              <form
                onSubmit={costForm.handleSubmit((d) => handleAddCost('variable')(d as CostFormData))}
                className="flex gap-3 items-end"
              >
                <div className="flex-1">
                  <Input
                    label="Descrição"
                    placeholder="Ex: Agulhas, Uber"
                    {...costForm.register('name')}
                  />
                </div>
                <div className="w-32 sm:w-48">
                  <Input
                    label="Valor (R$)"
                    type="number"
                    step="0.01"
                    placeholder="15,00"
                    {...costForm.register('amount')}
                  />
                </div>
                <Button type="submit" size="sm" className="mb-0.5" isLoading={isAddingCost}>
                  <Plus className="h-4 w-4" />
                </Button>
              </form>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.variableCosts.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell>{cost.name}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(cost.amount)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeCost({ id: cost.id, type: 'variable' })}>
                          <Trash2 className="h-4 w-4 text-zinc-500 hover:text-rose-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.variableCosts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-zinc-500 text-xs italic">
                        Nenhum custo variável cadastrado
                      </TableCell>
                    </TableRow>
                  )}
                  {(data?.variableCosts.length ?? 0) > 0 && (
                    <TableRow className="border-t border-zinc-700">
                      <TableCell className="font-bold text-zinc-300">Total</TableCell>
                      <TableCell className="text-right font-bold text-zinc-100">{formatCurrency(data?.totalVariable || 0)}</TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Coluna da Direita: Configurações e Simulador */}
        <div className="space-y-8">
          <Card title="Configurações">
            <form
              onSubmit={settingsForm.handleSubmit((d) => handleUpdateSettings(d as SettingsFormData))}
              className="space-y-4"
            >
              {!isStudioMode ? (
                <>
                  <Input
                    label="Horas de Trabalho Mensal"
                    type="number"
                    placeholder={data?.hoursPerMonth?.toString() || '100'}
                    {...settingsForm.register('hoursPerMonth')}
                  />
                  <Input
                    label="Margem de Lucro Desejada (%)"
                    type="number"
                    placeholder={data?.profitMargin?.toString() || '30'}
                    {...settingsForm.register('profitMargin')}
                  />
                </>
              ) : (
                <Input
                  label="Percentual pago ao studio (%)"
                  type="number"
                  placeholder={data?.studioPercentage?.toString() || '30'}
                  {...settingsForm.register('studioPercentage')}
                />
              )}
              <Button type="submit" className="w-full" isLoading={isSettingWorkSettings}>
                Salvar Configurações
              </Button>
            </form>
          </Card>

          {/* Resumo */}
          {!isStudioMode ? (
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-5 space-y-3">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Resumo</h3>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Total Custos Fixos:</span>
                <span className="text-zinc-100">{formatCurrency(data?.totalFixed || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Custo por Hora:</span>
                <span className="text-zinc-100">{formatCurrency(data?.costPerHour || 0)}</span>
              </div>
              <div className="pt-2 text-center border-t border-zinc-700">
                <span className="text-zinc-500 text-xs uppercase tracking-wider">Valor Hora Mínimo</span>
                <p className="text-3xl font-extrabold text-rose-500 mt-1">
                  {formatCurrency(data?.minimumPricePerHour || 0)}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-5 space-y-3">
              <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                Modo Studio — {data?.studioPercentage || 0}% ao studio
              </h3>
              <p className="text-xs text-zinc-500">
                Para cada R$ 100 cobrados, você fica com{' '}
                <span className="text-zinc-300 font-medium">
                  R$ {(100 - (data?.studioPercentage || 0)).toFixed(0)}
                </span>{' '}
                após descontar o studio.
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Custo variável por atend.:</span>
                <span className="text-zinc-100">{formatCurrency(data?.totalVariable || 0)}</span>
              </div>
            </div>
          )}

          {/* Simulador */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Calculator className="h-20 w-20 text-rose-500" />
            </div>

            <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-rose-500" />
              Simulador de Preço
            </h3>

            {!isStudioMode ? (
              <div className="space-y-6 relative">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
                    Tempo Estimado (Horas)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      className="flex-1 accent-rose-500"
                      value={simHours}
                      onChange={(e) => setSimHours(Number(e.target.value))}
                    />
                    <span className="text-xl font-bold text-zinc-100 w-12">{simHours}h</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Complexidade</label>
                  <div className="flex gap-2">
                    {[
                      { label: 'Baixa', val: 1.0 },
                      { label: 'Média', val: 1.2 },
                      { label: 'Alta', val: 1.5 },
                    ].map((lvl) => (
                      <button
                        key={lvl.label}
                        onClick={() => setSimComplexity(lvl.val)}
                        className={`flex-1 py-2 text-xs rounded-lg border transition-all ${
                          simComplexity === lvl.val
                            ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20'
                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-700/50">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold">Sugestão de Preço</span>
                  <p className="text-2xl font-black text-amber-400">{formatCurrency(simResultAutonomo)}</p>
                  <span className="text-[10px] text-zinc-500">
                    Inclui materiais ({formatCurrency(totalVariableCents)})
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 relative">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">
                    Quanto quer receber líquido (R$)
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-zinc-100 text-sm outline-none focus:border-rose-500"
                    value={desiredNet}
                    onChange={(e) => setDesiredNet(Number(e.target.value))}
                    placeholder="Ex: 150"
                  />
                </div>

                <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-700/50 space-y-2">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold">
                    Você precisa cobrar
                  </span>
                  <p className="text-2xl font-black text-amber-400">
                    {formatCurrency(neededPriceForDesiredNet)}
                  </p>
                  <div className="text-[10px] text-zinc-500 space-y-1 pt-1 border-t border-zinc-700">
                    <div className="flex justify-between">
                      <span>Studio recebe ({data?.studioPercentage || 0}%):</span>
                      <span className="text-zinc-400">
                        {formatCurrency(Math.round(neededPriceForDesiredNet * studioPct))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Seus custos variáveis:</span>
                      <span className="text-zinc-400">{formatCurrency(totalVariableCents)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-zinc-300 pt-1">
                      <span>Você fica com:</span>
                      <span className="text-emerald-400">{formatCurrency(desiredNet * 100)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
