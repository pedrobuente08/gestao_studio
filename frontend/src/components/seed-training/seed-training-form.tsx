'use client';

import { useState } from 'react';
import { Trash2, Plus, Save, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useSeedTraining } from '@/hooks/use-seed-training';
import { formatCurrency } from '@/utils/format-currency';
import {
  TATTOO_SIZE_LABELS,
  TATTOO_COMPLEXITY_LABELS,
  BODY_LOCATION_LABELS,
} from '@/utils/constants';
import {
  PendingEntry,
  SEED_MAX,
} from '@/types/seed-training.types';
import { TattooSize, TattooComplexity, BodyLocation } from '@/types/procedure.types';

const sizeOptions = Object.entries(TATTOO_SIZE_LABELS).map(([value, label]) => ({ value, label }));
const complexityOptions = Object.entries(TATTOO_COMPLEXITY_LABELS).map(([value, label]) => ({ value, label }));
const bodyLocationOptions = Object.entries(BODY_LOCATION_LABELS).map(([value, label]) => ({ value, label }));

const EMPTY_FORM = { size: '', complexity: '', bodyLocation: '', finalPrice: '' };

export function SeedTrainingForm() {
  const { entries, isLoading, bulkCreate, isSaving, removeEntry, isRemoving, savedCount } =
    useSeedTraining();

  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const totalCount = savedCount + pending.length;
  const remainingSlots = SEED_MAX - totalCount;
  const isAtLimit = totalCount >= SEED_MAX;

  const handleAdd = () => {
    setFormError('');

    if (!form.size || !form.complexity || !form.bodyLocation) {
      setFormError('Selecione tamanho, local e complexidade.');
      return;
    }

    const price = parseFloat(form.finalPrice);
    if (!form.finalPrice || isNaN(price) || price <= 0) {
      setFormError('Informe um valor válido maior que zero.');
      return;
    }

    if (isAtLimit) {
      setFormError(`Limite de ${SEED_MAX} entradas atingido.`);
      return;
    }

    setPending((prev) => [
      ...prev,
      {
        localId: `${Date.now()}-${Math.random()}`,
        size: form.size as TattooSize,
        complexity: form.complexity as TattooComplexity,
        bodyLocation: form.bodyLocation as BodyLocation,
        finalPrice: price,
      },
    ]);
    setForm(EMPTY_FORM);
  };

  const handleRemovePending = (localId: string) => {
    setPending((prev) => prev.filter((e) => e.localId !== localId));
  };

  const handleSaveAll = () => {
    if (pending.length === 0) return;

    bulkCreate(
      {
        entries: pending.map((e) => ({
          size: e.size,
          complexity: e.complexity,
          bodyLocation: e.bodyLocation,
          finalPrice: Math.round(e.finalPrice * 100), // R$ → centavos
        })),
      },
      {
        onSuccess: () => {
          setPending([]);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        },
      },
    );
  };

  const progressPercent = Math.min((totalCount / SEED_MAX) * 100, 100);
  const progressColor =
    totalCount >= SEED_MAX ? 'bg-rose-500' : totalCount >= 20 ? 'bg-emerald-500' : 'bg-zinc-500';

  return (
    <div className="space-y-6">
      {/* Cabeçalho com progresso */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Progresso</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {totalCount >= 20
                ? 'Você já tem dados suficientes para boas sugestões!'
                : `Adicione pelo menos ${20 - totalCount} entrada${20 - totalCount !== 1 ? 's' : ''} para ativar sugestões precisas.`}
            </p>
          </div>
          <span
            className={`text-2xl font-extrabold tabular-nums ${
              isAtLimit ? 'text-rose-400' : totalCount >= 20 ? 'text-emerald-400' : 'text-zinc-300'
            }`}
          >
            {totalCount}
            <span className="text-sm font-normal text-zinc-500">/{SEED_MAX}</span>
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Formulário de adição */}
      {!isAtLimit && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-200">Adicionar tatuagem</h3>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Select
              label="Tamanho"
              placeholder="Selecione"
              options={sizeOptions}
              value={form.size}
              onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
            />
            <Select
              label="Local do corpo"
              placeholder="Selecione"
              options={bodyLocationOptions}
              value={form.bodyLocation}
              onChange={(e) => setForm((f) => ({ ...f, bodyLocation: e.target.value }))}
            />
            <Select
              label="Complexidade"
              placeholder="Selecione"
              options={complexityOptions}
              value={form.complexity}
              onChange={(e) => setForm((f) => ({ ...f, complexity: e.target.value }))}
            />
            <Input
              label="Valor (R$)"
              type="number"
              step="0.01"
              min="1"
              placeholder="Ex: 450"
              value={form.finalPrice}
              onChange={(e) => setForm((f) => ({ ...f, finalPrice: e.target.value }))}
            />
          </div>

          {formError && <p className="text-sm text-red-400">{formError}</p>}

          <Button
            type="button"
            variant="secondary"
            onClick={handleAdd}
            disabled={isAtLimit}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar à lista ({remainingSlots} restantes)
          </Button>
        </div>
      )}

      {/* Entradas pendentes (ainda não salvas) */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-amber-300">
              {pending.length} entrada{pending.length !== 1 ? 's' : ''} não salva{pending.length !== 1 ? 's' : ''}
            </h3>
            <Button
              type="button"
              onClick={handleSaveAll}
              isLoading={isSaving}
              className="text-sm"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar tudo
            </Button>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {pending.map((e) => (
              <div
                key={e.localId}
                className="flex items-center justify-between rounded-lg bg-zinc-800/60 px-3 py-2 text-xs"
              >
                <div className="flex gap-3 text-zinc-300">
                  <span>{TATTOO_SIZE_LABELS[e.size]}</span>
                  <span className="text-zinc-600">·</span>
                  <span>{BODY_LOCATION_LABELS[e.bodyLocation]}</span>
                  <span className="text-zinc-600">·</span>
                  <span>{TATTOO_COMPLEXITY_LABELS[e.complexity]}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-amber-400 font-medium">
                    {formatCurrency(Math.round(e.finalPrice * 100))}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePending(e.localId)}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback de sucesso */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Dados salvos com sucesso! Agora eles já fazem parte das suas sugestões de preço.
        </div>
      )}

      {/* Entradas salvas */}
      {isLoading ? (
        <p className="text-zinc-500 text-sm text-center py-4">Carregando dados históricos...</p>
      ) : entries.length > 0 ? (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-200">
            Dados salvos ({savedCount}/{SEED_MAX})
          </h3>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-3 py-2 text-xs"
              >
                <div className="flex gap-3 text-zinc-300">
                  <span>{TATTOO_SIZE_LABELS[e.size]}</span>
                  <span className="text-zinc-600">·</span>
                  <span>{BODY_LOCATION_LABELS[e.bodyLocation]}</span>
                  <span className="text-zinc-600">·</span>
                  <span>{TATTOO_COMPLEXITY_LABELS[e.complexity]}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-zinc-300 font-medium">{formatCurrency(e.finalPrice)}</span>
                  <button
                    type="button"
                    onClick={() => removeEntry(e.id)}
                    disabled={isRemoving}
                    className="text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Estado vazio */}
      {!isLoading && entries.length === 0 && pending.length === 0 && (
        <p className="text-center text-zinc-500 text-sm py-4">
          Nenhum dado histórico cadastrado ainda. Adicione tatuagens que você já realizou para melhorar as sugestões de preço.
        </p>
      )}
    </div>
  );
}
