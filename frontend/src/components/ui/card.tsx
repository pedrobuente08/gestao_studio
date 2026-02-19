import React from 'react';

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'highlight';
}

export function Card({ title, description, children, className = '', variant = 'default' }: CardProps) {
  const borderClass = variant === 'highlight' ? 'border-rose-500/50' : 'border-zinc-800';

  return (
    <div className={`rounded-xl border ${borderClass} bg-zinc-900 overflow-hidden ${className}`}>
      {(title || description) && (
        <div className="p-4 sm:p-6 border-b border-zinc-800">
          {title && <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>}
          {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
        </div>
      )}
      <div className="p-4 sm:p-6 italic:not-italic">{children}</div>
    </div>
  );
}

export function TableHead({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 font-medium text-zinc-400 ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) {
  return <td className={`px-4 py-3 text-zinc-300 ${className}`} colSpan={colSpan}>{children}</td>;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  className?: string;
  variant?: 'default' | 'highlight';
}

export function StatCard({ title, value, description, icon, trend, className = '', variant = 'default' }: StatCardProps) {
  const borderClass = variant === 'highlight' ? 'border-rose-500/50 shadow-lg shadow-rose-500/5' : 'border-zinc-800';
  
  return (
    <div className={`rounded-xl border ${borderClass} bg-zinc-900 p-4 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-100">{value}</p>
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800 text-rose-500">
            {icon}
          </div>
        )}
      </div>
      {(description || trend) && (
        <div className="mt-4 flex items-center">
          {trend && (
            <span className={`mr-2 text-sm font-medium ${trend.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend.isUp ? '↑' : '↓'} {trend.value}%
            </span>
          )}
          {description && <span className="text-sm text-zinc-500">{description}</span>}
        </div>
      )}
    </div>
  );
}
