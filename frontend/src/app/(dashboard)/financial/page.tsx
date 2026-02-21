'use client';

import { useState } from 'react';
import { useFinancial } from '@/hooks/use-financial';
import { Button } from '@/components/ui/button';
import { Card, StatCard } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
  TableEmpty,
} from '@/components/ui/table';
import { TransactionModal } from '@/components/modals/transaction-modal';
import { PageHeader } from '@/components/ui/page-header';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/format-date';
import { Plus, Search, TrendingDown, TrendingUp, MoreVertical, Wallet } from 'lucide-react';
import { Transaction } from '@/types/financial.types';
import { TRANSACTION_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from '@/utils/constants';
import { Skeleton } from '@/components/ui/skeleton';

export default function FinancialPage() {
  const { transactions, summary, isLoading, isError } = useFinancial();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();

  const filteredTransactions = transactions.filter((t) =>
    (t.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedTransaction(undefined);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Método'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.date,
        `"${t.description || ''}"`,
        t.category,
        t.type,
        (t.amount / 100).toFixed(2),
        t.paymentMethod || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpense || 0;
  const balance = summary?.balance || 0;

  if (isLoading) {
    return (
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>

        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
        <p className="text-zinc-400 text-sm">Não foi possível carregar os dados financeiros.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Financeiro"
        description="Fluxo de caixa e gestão de despesas"
      >
        <Button variant="ghost" onClick={handleExport} className="hidden sm:flex text-zinc-400 hover:text-zinc-100">
          Exportar CSV
        </Button>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </PageHeader>

      {/* Resumo Financeiro */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-8">
        <StatCard
          title="Receitas"
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp className="h-6 w-6" />}
          description="Total bruto recebido"
          className="bg-emerald-500/5 border-emerald-500/10"
        />
        <StatCard
          title="Despesas"
          value={formatCurrency(totalExpense)}
          icon={<TrendingDown className="h-6 w-6 text-rose-500" />}
          description="Custos e materiais"
          className="bg-rose-500/5 border-rose-500/10"
        />
        <StatCard
          title="Saldo Líquido"
          value={formatCurrency(balance)}
          icon={<Wallet className="h-6 w-6" />}
          description="Resultado do período"
          variant="highlight"
        />
      </div>

      <Card>
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 focus-within:border-rose-500 transition-colors">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            className="flex-1 bg-transparent text-sm text-zinc-100 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <span className="text-zinc-200">{transaction.description}</span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                      {TRANSACTION_CATEGORY_LABELS[transaction.category] || transaction.category}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-zinc-400 text-sm">
                      {transaction.paymentMethod ? PAYMENT_METHOD_LABELS[transaction.paymentMethod] : '—'}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${
                    transaction.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {transaction.type === 'INCOME' ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(transaction)}
                    >
                      <MoreVertical className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableEmpty colSpan={6} />
            )}
          </TableBody>
        </Table>
      </Card>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
}
