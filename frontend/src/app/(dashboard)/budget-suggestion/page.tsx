'use client';

import { useState } from 'react';
import { useServiceTypes } from '@/hooks/use-service-types';
import { priceSuggestionService, PriceSuggestionResult } from '@/services/price-suggestion.service';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/format-date';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { SeedTrainingForm } from '@/components/seed-training/seed-training-form';
import {
  TATTOO_SIZE_LABELS,
  TATTOO_COMPLEXITY_LABELS,
  BODY_LOCATION_LABELS,
} from '@/utils/constants';
import { Lightbulb, TrendingUp, Database, Search, AlertCircle, History } from 'lucide-react';

const MIN_SESSIONS_FOR_SUGGESTION = 3;
type Tab = 'suggestion' | 'history';

export default function BudgetSuggestionPage() {
  const { serviceTypes } = useServiceTypes();

  const [activeTab, setActiveTab] = useState<Tab>('suggestion');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [size, setSize] = useState('');
  const [complexity, setComplexity] = useState('');
  const [bodyLocation, setBodyLocation] = useState('');
  const [result, setResult] = useState<PriceSuggestionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedServiceType = serviceTypes.find(t => t.id === serviceTypeId);
  const isTattoo = selectedServiceType?.name === 'Tatuagem';

  const serviceTypeOptions = serviceTypes.map(t => ({ value: t.id, label: t.name }));
  const sizeOptions = Object.entries(TATTOO_SIZE_LABELS).map(([value, label]) => ({ value, label }));
  const complexityOptions = Object.entries(TATTOO_COMPLEXITY_LABELS).map(([value, label]) => ({ value, label }));
  const bodyLocationOptions = Object.entries(BODY_LOCATION_LABELS).map(([value, label]) => ({ value, label }));

  const handleSearch = async () => {
    if (!serviceTypeId) return;
    setIsLoading(true);
    try {
      const data = await priceSuggestionService.getSuggestion({
        serviceTypeId,
        size: isTattoo && size ? size : undefined,
        complexity: isTattoo && complexity ? complexity : undefined,
        bodyLocation: isTattoo && bodyLocation ? bodyLocation : undefined,
      });
      setResult(data);
    } finally {
      setIsLoading(false);
    }
  };

  const hasEnoughData = result && result.count >= MIN_SESSIONS_FOR_SUGGESTION;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Sugestão de Orçamento</h1>
        <p className="text-zinc-400">
          Encontre referências de preço baseadas nos seus procedimentos registrados
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 rounded-lg border border-zinc-700 bg-zinc-900 p-1 w-fit">
        <button
          onClick={() => setActiveTab('suggestion')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'suggestion'
              ? 'bg-rose-500 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Search className="h-4 w-4" />
          Sugestão de Preço
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-rose-500 text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="h-4 w-4" />
          Dados Históricos
        </button>
      </div>

      {/* ── Aba: Sugestão de Preço ───────────────────────────────── */}
      {activeTab === 'suggestion' && (
        <div className="space-y-8">
          <Card title="Parâmetros do Serviço">
            <div className="space-y-4">
              <Select
                label="Tipo de Serviço"
                placeholder="Selecione o tipo"
                options={serviceTypeOptions}
                value={serviceTypeId}
                onChange={(e) => {
                  setServiceTypeId(e.target.value);
                  setResult(null);
                }}
              />

              {isTattoo && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Select
                    label="Tamanho"
                    placeholder="Qualquer tamanho"
                    options={[{ value: '', label: 'Qualquer tamanho' }, ...sizeOptions]}
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                  />
                  <Select
                    label="Complexidade"
                    placeholder="Qualquer complexidade"
                    options={[{ value: '', label: 'Qualquer complexidade' }, ...complexityOptions]}
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value)}
                  />
                  <Select
                    label="Local do Corpo"
                    placeholder="Qualquer local"
                    options={[{ value: '', label: 'Qualquer local' }, ...bodyLocationOptions]}
                    value={bodyLocation}
                    onChange={(e) => setBodyLocation(e.target.value)}
                  />
                </div>
              )}

              <Button
                onClick={handleSearch}
                disabled={!serviceTypeId}
                isLoading={isLoading}
                className="w-full sm:w-auto"
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar Referências
              </Button>
            </div>
          </Card>

          {result !== null && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Painel 1: Baseado nos seus dados */}
              <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-rose-500" />
                  <h2 className="text-lg font-bold text-zinc-100">Baseado nos Seus Dados</h2>
                </div>

                {hasEnoughData ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs text-zinc-500">
                        Baseado em{' '}
                        <span className="text-zinc-300 font-medium">
                          {result.count} procedimento{result.count !== 1 ? 's' : ''}
                        </span>{' '}
                        similares
                        {result.seedCount != null && result.seedCount > 0 && (
                          <span className="text-zinc-500">
                            {' '}({result.seedCount} histórico{result.seedCount !== 1 ? 's' : ''})
                          </span>
                        )}
                      </p>

                      {result.confidence === 'high' && (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                          Alta confiança
                        </span>
                      )}
                      {result.confidence === 'medium' && (
                        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400 ring-1 ring-amber-500/30">
                          Confiança moderada
                        </span>
                      )}
                      {result.confidence === 'low' && (
                        <span className="inline-flex items-center rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-400 ring-1 ring-rose-500/30">
                          Poucos dados similares
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg bg-zinc-800 p-3 text-center">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Mínimo</span>
                        <span className="text-lg font-bold text-zinc-200">{formatCurrency(result.min!)}</span>
                      </div>
                      <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-center">
                        <span className="text-[10px] text-rose-400 uppercase font-bold block mb-1">Média</span>
                        <span className="text-xl font-extrabold text-rose-400">{formatCurrency(result.avg!)}</span>
                      </div>
                      <div className="rounded-lg bg-zinc-800 p-3 text-center">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Máximo</span>
                        <span className="text-lg font-bold text-zinc-200">{formatCurrency(result.max!)}</span>
                      </div>
                    </div>

                    {result.sessions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold">Sessões reais usadas como referência</span>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {result.sessions.map((s) => (
                            <div key={s.id} className="flex justify-between items-center text-xs py-1.5 px-2 rounded bg-zinc-800/50">
                              <div>
                                <span className="text-zinc-300">{s.client?.name || 'Cliente'}</span>
                                {s.description && (
                                  <span className="text-zinc-500 ml-2">— {s.description}</span>
                                )}
                              </div>
                              <div className="text-right shrink-0 ml-3">
                                <span className="text-amber-400 font-medium">{formatCurrency(s.finalPrice)}</span>
                                <span className="text-zinc-600 block">{formatDate(s.date)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                    <AlertCircle className="h-8 w-8 text-zinc-600" />
                    <div>
                      <p className="text-zinc-400 font-medium">Dados insuficientes</p>
                      <p className="text-zinc-500 text-sm mt-1">
                        {result.count === 0
                          ? 'Nenhum procedimento similar encontrado.'
                          : `Apenas ${result.count} procedimento${result.count !== 1 ? 's' : ''} encontrado${result.count !== 1 ? 's' : ''}.`}
                        {' '}
                        <button
                          onClick={() => setActiveTab('history')}
                          className="text-rose-400 hover:underline"
                        >
                          Adicione dados históricos
                        </button>
                        {' '}para melhorar as sugestões.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Painel 2: Modelo de IA */}
              <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                  <h2 className="text-lg font-bold text-zinc-100">Modelo de IA</h2>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                  <Lightbulb className="h-8 w-8 text-zinc-600" />
                  <div>
                    <p className="text-zinc-400 font-medium">Modelo ainda não treinado</p>
                    <p className="text-zinc-500 text-sm mt-1">
                      Continue registrando procedimentos. Quando houver dados suficientes,
                      o modelo de IA será treinado e oferecerá sugestões ainda mais precisas.
                    </p>
                  </div>
                </div>
              </div>

              {hasEnoughData && (
                <div className="lg:col-span-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-6 w-6 text-amber-400 shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-zinc-100">Sugestão de Preço</h3>
                      <p className="text-zinc-400 text-sm">
                        Com base nos seus {result.count} procedimentos similares, cobrar entre{' '}
                        <span className="text-amber-400 font-bold">{formatCurrency(result.min!)}</span>
                        {' '}e{' '}
                        <span className="text-amber-400 font-bold">{formatCurrency(result.max!)}</span>
                        {' '}está dentro da sua faixa habitual. A média praticada foi{' '}
                        <span className="text-amber-400 font-bold">{formatCurrency(result.avg!)}</span>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {result === null && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="rounded-full bg-zinc-800 p-6">
                <Lightbulb className="h-10 w-10 text-zinc-600" />
              </div>
              <div>
                <p className="text-zinc-300 font-medium text-lg">Encontre o preço certo</p>
                <p className="text-zinc-500 mt-1">
                  Selecione o tipo de serviço acima e clique em "Buscar Referências"
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Aba: Dados Históricos ────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <p className="text-zinc-400 text-sm">
            Insira tatuagens que você já realizou antes de usar este sistema.
            Esses dados se somam às suas sessões registradas para melhorar as sugestões de preço.
            Máximo de 30 entradas.
          </p>
          <SeedTrainingForm />
        </div>
      )}
    </div>
  );
}
