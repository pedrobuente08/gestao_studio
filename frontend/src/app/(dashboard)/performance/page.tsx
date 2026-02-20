'use client';

import { useState } from 'react';
import { useSessionStats } from '@/hooks/use-session-stats';
import { StatCard } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format-currency';
import { useServiceTypes } from '@/hooks/use-service-types';
import { useEmployees } from '@/hooks/use-employees';
import { BarChart } from '@/components/charts/bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';

export default function PerformancePage() {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    serviceTypeId: '',
    userId: '',
  });

  const { stats, isLoading } = useSessionStats(filters);
  const { serviceTypes } = useServiceTypes();
  const { employees } = useEmployees();

  const serviceTypeData = stats?.byServiceType.map((t: any) => ({
    name: t.name,
    value: t.revenue / 100,
  })) || [];

  const employeeData = stats?.byEmployee.map((e: any) => ({
    name: e.name,
    value: e.revenue / 100,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-100">Desempenho</h1>
        
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-rose-500"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-rose-500"
          />
          <select
            value={filters.userId}
            onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 outline-none focus:border-rose-500"
          >
            <option value="">Todos Profissionais</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-xl bg-zinc-900/50" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Faturamento Total" value={formatCurrency(stats?.totalRevenue || 0)} description="No período selecionado" />
            <StatCard title="Atendimentos" value={String(stats?.sessionCount || 0)} description="Sessões realizadas" />
            <StatCard title="Ticket Médio" value={formatCurrency(stats?.avgTicket || 0)} description="Por atendimento" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
              <h3 className="mb-6 text-sm font-medium text-zinc-400">Faturamento por Serviço</h3>
              <div className="h-[300px]">
                {serviceTypeData.length > 0 ? (
                  <DonutChart data={serviceTypeData} />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-600 italic">Sem dados para o período</div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
              <h3 className="mb-6 text-sm font-medium text-zinc-400">Desempenho da Equipe (R$)</h3>
              <div className="h-[300px]">
                {employeeData.length > 0 ? (
                  <BarChart data={employeeData} />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-600 italic">Sem dados para o período</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
