'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-zinc-400">
            Bem-vindo, {user?.name || 'Usuário'}
          </p>
        </div>
        <Button variant="outline" onClick={logout}>
          Sair
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-zinc-400">Faturamento Mensal</h3>
          <p className="mt-2 text-2xl font-bold text-zinc-100">R$ 0,00</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-zinc-400">Clientes Ativos</h3>
          <p className="mt-2 text-2xl font-bold text-zinc-100">0</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-zinc-400">Procedimentos</h3>
          <p className="mt-2 text-2xl font-bold text-zinc-100">0</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-zinc-400">Ticket Médio</h3>
          <p className="mt-2 text-2xl font-bold text-zinc-100">R$ 0,00</p>
        </div>
      </div>
    </div>
  );
}
