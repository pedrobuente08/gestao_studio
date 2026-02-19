'use client';

import { useState } from 'react';
import { useCalculator } from '@/hooks/use-calculator';
import { Button } from '@/components/ui/button';
import { Card, StatCard } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell, 
  TableSkeleton 
} from '@/components/ui/table';
import { formatCurrency } from '@/utils/format-currency';
import { 
  Plus, 
  Trash2, 
  Settings2, 
  Calculator, 
  TrendingUp, 
  Clock, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const settingsSchema = z.object({
  hoursPerMonth: z.coerce.number().min(1, 'Mínimo de 1 hora'),
  profitMargin: z.coerce.number().min(0).max(100, 'Margem entre 0 e 100%'),
});

const costSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres'),
  amount: z.coerce.number().min(1, 'Valor deve ser maior que 0'),
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
    isSettingWorkSettings
  } = useCalculator();

  const [simHours, setSimHours] = useState(2);
  const [simComplexity, setSimComplexity] = useState(1.2); // Multiplicador

  const settingsForm = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema) as any,
  });

  const costForm = useForm<CostFormData>({
    resolver: zodResolver(costSchema) as any,
  });

  // Simulador local
  const minPerHour = data?.minimumPricePerHour || 0;
  const simResult = Math.round(minPerHour * simHours * simComplexity);

  const handleAddCost = (type: 'fixed' | 'variable') => (formData: CostFormData) => {
    addCost({ data: { ...formData, type }, type });
    costForm.reset();
  };

  const handleUpdateSettings = (formData: SettingsFormData) => {
    setWorkSettings(formData);
  };

  if (isLoading) return <div className="p-8"><p className="text-zinc-400">Carregando...</p></div>;

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 italic:not-italic">Calculadora de Custos</h1>
        <p className="text-zinc-400">
          Entenda seus custos e defina preços lucrativos
        </p>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Coluna da Esquerda: Custos */}
        <div className="lg:col-span-2 space-y-8">
          {/* Custos Fixos */}
          <Card title="Custos Fixos Mensais" description="Aluguel, luz, internet, etc.">
            <div className="space-y-6">
              <form 
                onSubmit={costForm.handleSubmit((data) => handleAddCost('fixed')(data as CostFormData))}
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
                    label="Valor (centavos)" 
                    type="number" 
                    placeholder="20000"
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
                    <TableRow><TableCell colSpan={3} className="text-center py-4 text-zinc-500 text-xs italic">Nenhum custo fixo cadastrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Custos Variáveis */}
          <Card title="Custos Materiais por Sessão" description="Agulhas, tintas, luvas, etc.">
            <div className="space-y-6">
              <form 
                onSubmit={costForm.handleSubmit((data) => handleAddCost('variable')(data as CostFormData))}
                className="flex gap-3 items-end"
              >
                <div className="flex-1">
                  <Input 
                    label="Material/Descartável" 
                    placeholder="Ex: Kit Agulhas" 
                    {...costForm.register('name')}
                  />
                </div>
                <div className="w-32 sm:w-48">
                  <Input 
                    label="Valor (centavos)" 
                    type="number"
                    placeholder="1500"
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
                    <TableHead>Material</TableHead>
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
                    <TableRow><TableCell colSpan={3} className="text-center py-4 text-zinc-500 text-xs italic">Nenhum custo variável cadastrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Coluna da Direita: Configurações e Simulador */}
        <div className="space-y-8">
          <Card title="Configurações de Trabalho">
            <form onSubmit={settingsForm.handleSubmit((data) => handleUpdateSettings(data as SettingsFormData))} className="space-y-4">
              <Input 
                label="Horas de Trabalho Mensal" 
                type="number"
                placeholder={data?.hoursPerMonth.toString() || "100"}
                {...settingsForm.register('hoursPerMonth')}
              />
              <Input 
                label="Margem de Lucro Desejada (%)" 
                type="number"
                placeholder={data?.profitMargin.toString() || "30"}
                {...settingsForm.register('profitMargin')}
              />
              <Button type="submit" className="w-full" isLoading={isSettingWorkSettings}>
                Atualizar Metas
              </Button>
            </form>
          </Card>

          <Card variant="highlight" title="Resumo de Valor" className="bg-rose-500/5">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Total Custos Fixos:</span>
                <span className="text-zinc-100 font-medium">{formatCurrency(data?.totalFixedCosts || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Custo Base por Hora (Mão de Obra):</span>
                <span className="text-zinc-100 font-medium">{formatCurrency(data?.costPerHour || 0)}</span>
              </div>
              <div className="pt-2 text-center">
                <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Valor Hora Mínimo Sugerido</span>
                <p className="text-3xl font-extrabold text-rose-500 mt-1">
                  {formatCurrency(data?.minimumPricePerHour || 0)}
                </p>
              </div>
            </div>
          </Card>

          {/* Simulador Interativo */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Calculator className="h-20 w-20 text-rose-500" />
            </div>
            
            <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-rose-500" />
              Simulador de Preço
            </h3>
            
            <div className="space-y-6 relative">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Tempo Estimado (Horas)</label>
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
                <span className="text-zinc-500 text-[10px] uppercase font-bold">Sugestão de Preço para este Trabalho</span>
                <p className="text-2xl font-black text-amber-400">
                  {formatCurrency(simResult + (data?.totalVariableCosts || 0))}
                </p>
                <span className="text-[10px] text-zinc-500">Inclui custos de materiais ({formatCurrency(data?.totalVariableCosts || 0)})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
