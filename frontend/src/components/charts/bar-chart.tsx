'use client';

import React from 'react';
import {
  BarChart as ReChartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { formatCurrency } from '@/utils/format-currency';

interface BarChartProps {
  data: { name: string; value: number }[];
  height?: number;
  layout?: 'horizontal' | 'vertical';
  color?: string;
}

export function BarChart({ data, height = 300, layout = 'vertical', color = '#f43f5e' }: BarChartProps) {
  const isVertical = layout === 'vertical';

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ReChartsBar
          data={data}
          layout={isVertical ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 110, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={!isVertical} vertical={false} />
          {isVertical ? (
            <>
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#71717a"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  const reais = value / 100;
                  if (reais >= 1000) return `R$ ${(reais / 1000).toFixed(1).replace(/\.0$/, '')}k`;
                  return `R$ ${reais.toFixed(0)}`;
                }}
              />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              borderColor: '#27272a',
              borderRadius: '8px',
              color: '#f4f4f5',
            }}
            formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Faturamento']}
            cursor={{ fill: '#27272a', opacity: 0.4 }}
          />
          <Bar
            dataKey="value"
            fill={color}
            radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            barSize={isVertical ? 20 : 40}
          >
            {isVertical && (
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value: number) => formatCurrency(value)}
                style={{ fill: '#a1a1aa', fontSize: 12 }}
              />
            )}
          </Bar>
        </ReChartsBar>
      </ResponsiveContainer>
    </div>
  );
}
