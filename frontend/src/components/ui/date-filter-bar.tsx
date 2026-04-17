'use client';

import { useState } from 'react';

export interface DateFilter {
  startDate: string;
  endDate: string;
}

interface DateFilterBarProps {
  value: DateFilter | null;
  onChange: (filter: DateFilter | null) => void;
}

const presets: { label: string; days?: number; currentMonth?: boolean }[] = [
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
  { label: 'Mês atual', currentMonth: true },
];

function getPresetFilter(preset: typeof presets[number]): DateFilter {
  const now = new Date();
  if (preset.currentMonth) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (preset.days! - 1));
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function isSameFilter(a: DateFilter | null, b: DateFilter): boolean {
  return a?.startDate === b.startDate && a?.endDate === b.endDate;
}

export function DateFilterBar({ value, onChange }: DateFilterBarProps) {
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handlePreset = (preset: typeof presets[number]) => {
    const filter = getPresetFilter(preset);
    if (isSameFilter(value, filter)) {
      onChange(null);
    } else {
      onChange(filter);
      setCustomStart('');
      setCustomEnd('');
    }
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({ startDate: customStart, endDate: customEnd });
    } else if (customStart) {
      onChange({ startDate: customStart, endDate: customStart });
    }
  };

  const handleClear = () => {
    onChange(null);
    setCustomStart('');
    setCustomEnd('');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((preset) => {
        const filter = getPresetFilter(preset);
        const active = isSameFilter(value, filter);
        return (
          <button
            key={preset.label}
            onClick={() => handlePreset(preset)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[36px] ${
              active
                ? 'bg-rose-500 text-white'
                : 'bg-surface-elevated text-content-secondary hover:bg-surface-elevated hover:text-content-primary'
            }`}
          >
            {preset.label}
          </button>
        );
      })}

      <div className="hidden sm:flex items-center gap-1.5">
        <input
          type="date"
          value={customStart}
          onChange={(e) => setCustomStart(e.target.value)}
          className="h-9 rounded-lg bg-surface-elevated border border-edge-muted px-2 text-sm text-content-primary focus:outline-none focus:border-rose-500"
        />
        <span className="text-content-muted text-sm">até</span>
        <input
          type="date"
          value={customEnd}
          onChange={(e) => setCustomEnd(e.target.value)}
          className="h-9 rounded-lg bg-surface-elevated border border-edge-muted px-2 text-sm text-content-primary focus:outline-none focus:border-rose-500"
        />
        {(customStart || customEnd) && (
          <button
            onClick={handleCustomApply}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors"
          >
            Aplicar
          </button>
        )}
      </div>

      {value && (
        <button
          onClick={handleClear}
          className="px-3 py-2 rounded-lg text-sm text-content-muted hover:text-content-primary transition-colors underline min-h-[36px]"
        >
          Limpar
        </button>
      )}
    </div>
  );
}
