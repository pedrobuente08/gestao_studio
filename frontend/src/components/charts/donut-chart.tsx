'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/utils/format-currency';
import { useChartPalette } from '@/components/charts/use-chart-palette';

const PALETTE = [
  '#f43f5e', // rose-500
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
];

interface DonutChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
}

export function DonutChart({ data, height = 300 }: DonutChartProps) {
  const p = useChartPalette();

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: p.tooltipBg,
              borderColor: p.tooltipBorder,
              borderRadius: '8px',
              color: p.tooltipText,
            }}
            formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Valor']}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-content-secondary text-sm">{value}</span>}
          />
          <Pie
            data={data}
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color ?? PALETTE[index % PALETTE.length]} stroke="transparent" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
