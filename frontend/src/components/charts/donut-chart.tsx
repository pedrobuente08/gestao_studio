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

interface DonutChartProps {
  data: { name: string; value: number; color: string }[];
  height?: number;
}

export function DonutChart({ data, height = 300 }: DonutChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              borderColor: '#27272a',
              borderRadius: '8px',
              color: '#f4f4f5',
            }}
            formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Valor']}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-zinc-400 text-sm">{value}</span>}
          />
          <Pie
            data={data}
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
