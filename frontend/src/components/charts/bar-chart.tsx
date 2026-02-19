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
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={!isVertical} vertical={isVertical} />
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
                tickFormatter={(value) => `R$ ${value / 100}`}
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
            formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Valor']}
            cursor={{ fill: '#27272a', opacity: 0.4 }}
          />
          <Bar 
            dataKey="value" 
            fill={color} 
            radius={isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            barSize={isVertical ? 20 : 40}
          />
        </ReChartsBar>
      </ResponsiveContainer>
    </div>
  );
}
