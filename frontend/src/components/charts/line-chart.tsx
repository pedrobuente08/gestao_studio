'use client';

import React from 'react';
import {
  LineChart as ReChartsLine,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/utils/format-currency';
import { useChartPalette } from '@/components/charts/use-chart-palette';

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export function LineChart({ data, height = 300 }: LineChartProps) {
  const p = useChartPalette();

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ReChartsLine data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={p.grid} vertical={false} />
          <XAxis 
            dataKey="label" 
            stroke={p.axis} 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke={p.axis}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              const reais = value / 100;
              if (reais >= 1000) return `R$ ${(reais / 1000).toFixed(1).replace(/\.0$/, '')}k`;
              return `R$ ${reais.toFixed(0)}`;
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: p.tooltipBg,
              borderColor: p.tooltipBorder,
              borderRadius: '8px',
              color: p.tooltipText,
            }}
            formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Valor']}
            labelStyle={{ color: p.tooltipLabel, marginBottom: '4px' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#f43f5e"
            strokeWidth={3}
            dot={{ fill: '#f43f5e', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </ReChartsLine>
      </ResponsiveContainer>
    </div>
  );
}
