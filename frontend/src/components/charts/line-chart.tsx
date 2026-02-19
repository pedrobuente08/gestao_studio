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

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export function LineChart({ data, height = 300 }: LineChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ReChartsLine data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="label" 
            stroke="#71717a" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis 
            stroke="#71717a" 
            fontSize={12} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `R$ ${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              borderColor: '#27272a',
              borderRadius: '8px',
              color: '#f4f4f5',
            }}
            formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Valor']}
            labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
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
