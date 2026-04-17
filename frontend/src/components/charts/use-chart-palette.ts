'use client';

import { useMemo } from 'react';
import { useTheme } from '@/components/theme/theme-provider';

export type ChartPalette = {
  grid: string;
  axis: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  tooltipLabel: string;
  cursor: string;
  labelList: string;
};

export function useChartPalette(): ChartPalette {
  const { resolved, mounted } = useTheme();
  const dark = !mounted || resolved === 'dark';

  return useMemo(
    () =>
      dark
        ? {
            grid: '#27272a',
            axis: '#71717a',
            tooltipBg: '#18181b',
            tooltipBorder: '#27272a',
            tooltipText: '#f4f4f5',
            tooltipLabel: '#a1a1aa',
            cursor: 'rgba(39,39,42,0.45)',
            labelList: '#a1a1aa',
          }
        : {
            grid: '#e5e7eb',
            axis: '#6b7280',
            tooltipBg: '#ffffff',
            tooltipBorder: '#e5e7eb',
            tooltipText: '#111827',
            tooltipLabel: '#6b7280',
            cursor: 'rgba(228,228,231,0.85)',
            labelList: '#6b7280',
          },
    [dark],
  );
}
