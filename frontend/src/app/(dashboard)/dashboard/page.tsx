'use client';

import { useAuth } from '@/hooks/use-auth';
import { useClients } from '@/hooks/use-clients';
import { useSessions } from '@/hooks/use-sessions';
import { useFinancial } from '@/hooks/use-financial';
import { StatCard } from '@/components/ui/card';
import { LineChart } from '@/components/charts/line-chart';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableSkeleton, TableEmpty } from '@/components/ui/table';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/format-date';
import { Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';

export default function DashboardPage() {
  const { user } = useAuth();
  const { clients, isLoading: isLoadingClients } = useClients();
  const { sessions, isLoading: isLoadingSessions } = useSessions();
  const { summary, isLoading: isLoadingFinancial } = useFinancial();

  const isLoading = isLoadingClients || isLoadingSessions || isLoadingFinancial;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-2 mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>

        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Pegar as últimas 5 sessões (ordenadas por data decrescente)
  const latestSessions = [...sessions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5);

  // Calcular ticket médio
  const totalRevenue = summary?.totalIncome || 0;
  const sessionCount = sessions.length;
  const averageTicket = sessionCount > 0 ? Math.round(totalRevenue / sessionCount) : 0;

  // Mock data para o gráfico (em produção isso deve vir da API formatado por mês)
  const chartData = [
    { label: 'Set', value: 450000 },
    { label: 'Out', value: 520000 },
    { label: 'Nov', value: 480000 },
    { label: 'Dez', value: 650000 },
    { label: 'Jan', value: 590000 },
    { label: 'Fev', value: totalRevenue },
  ];

  const firstName = user?.name?.split(' ')[0] || 'Usuário';

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={`Bem-vindo, ${firstName}`}
        description="Acompanhe o desempenho do seu estúdio em tempo real"
      />

      {/* Métricas Principais */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Faturamento Mensal"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="h-6 w-6" />}
          trend={{ value: 12, isUp: true }}
          description="em relação ao mês passado"
        />
        <StatCard
          title="Clientes Ativos"
          value={clients.length}
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          title="Sessões Realizadas"
          value={sessions.length}
          icon={<Calendar className="h-6 w-6" />}
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(averageTicket)}
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Gráfico de Faturamento */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-100">Faturamento Mensal</h3>
            <span className="text-xs text-zinc-500">Últimos 6 meses</span>
          </div>
          <LineChart data={chartData} />
        </div>

        {/* Últimas Sessões */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-zinc-100">Últimas Sessões</h3>
            <Link href="/sessions">
              <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-400">
                Ver todas
              </Button>
            </Link>
          </div>
          
          <Table className="bg-transparent border-none">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-zinc-800">
                <TableHead className="px-0">Cliente</TableHead>
                <TableHead className="text-right px-0">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton colSpan={2} rows={5} />
              ) : latestSessions.length > 0 ? (
                latestSessions.map((session) => (
                  <TableRow key={session.id} className="hover:bg-zinc-800/30 border-zinc-800/50">
                    <TableCell className="px-0">
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-200">{session.client?.name || 'Cliente'}</span>
                        <span className="text-xs text-zinc-500">{formatDate(session.date)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-0 font-medium text-amber-400">
                      {formatCurrency(session.finalPrice)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableEmpty colSpan={2} />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
