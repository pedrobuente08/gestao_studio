'use client';

import { useState } from 'react';
import { useFinancial } from '@/hooks/use-financial';
import { useEmployees } from '@/hooks/use-employees';
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
import { DateFilterBar, DateFilter } from '@/components/ui/date-filter-bar';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/format-date';
import { Plus, Search, TrendingDown, TrendingUp, MoreVertical, Wallet, RefreshCw, Repeat2, Pencil, Trash2, X, Check } from 'lucide-react';
import { Transaction, RecurringExpense } from '@/types/financial.types';
import { TRANSACTION_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from '@/utils/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecurringExpenses } from '@/hooks/use-financial';

export default function FinancialPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();
  const [showRecurring, setShowRecurring] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);
  const [recurringForm, setRecurringForm] = useState({ name: '', amount: '', category: 'FIXED', dayOfMonth: '1' });

  const { employees } = useEmployees();
  const { recurring, createRecurring, updateRecurring, deleteRecurring, processRecurring, isCreating, isProcessing, processResult } = useRecurringExpenses();

  const { transactions, summary, isLoading, isError } = useFinancial({
    startDate: dateFilter?.startDate,
    endDate: dateFilter?.endDate,
    userId: selectedUserId || undefined,
  });

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

      {/* Gastos Recorrentes */}
      <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/50">
        <button
          onClick={() => setShowRecurring((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Repeat2 className="h-4 w-4 text-rose-400" />
            Gastos Recorrentes
            <span className="text-xs text-zinc-500 font-normal">
              ({recurring.filter(r => r.isActive).length} ativo{recurring.filter(r => r.isActive).length !== 1 ? 's' : ''})
            </span>
          </span>
          <span className="text-zinc-600 text-xs">{showRecurring ? '▲' : '▼'}</span>
        </button>

        {showRecurring && (
          <div className="border-t border-zinc-800 p-4 space-y-4">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Cadastre aqui os gastos que se repetem todo mês (aluguel, internet, IPTU, etc.). No dia 1º de cada mês eles são lançados automaticamente como despesas no financeiro. Você pode editar o valor quando ele mudar.
            </p>

            {/* Formulário de novo recorrente */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
              <input
                placeholder="Nome (ex: Aluguel)"
                value={recurringForm.name}
                onChange={(e) => setRecurringForm(f => ({ ...f, name: e.target.value }))}
                className="col-span-2 sm:col-span-1 rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-rose-500"
              />
              <input
                placeholder="Valor R$"
                type="number"
                step="0.01"
                value={recurringForm.amount}
                onChange={(e) => setRecurringForm(f => ({ ...f, amount: e.target.value }))}
                className="rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-rose-500"
              />
              <select
                value={recurringForm.category}
                onChange={(e) => setRecurringForm(f => ({ ...f, category: e.target.value }))}
                className="rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-rose-500"
              >
                {Object.entries(TRANSACTION_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <Button
                size="sm"
                isLoading={isCreating}
                disabled={!recurringForm.name || !recurringForm.amount}
                onClick={() => {
                  createRecurring({
                    name: recurringForm.name,
                    amount: Math.round(parseFloat(recurringForm.amount) * 100),
                    category: recurringForm.category as any,
                    dayOfMonth: parseInt(recurringForm.dayOfMonth) || 1,
                  }, {
                    onSuccess: () => setRecurringForm({ name: '', amount: '', category: 'FIXED', dayOfMonth: '1' }),
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>

            {/* Lista de recorrentes */}
            {recurring.length > 0 && (
              <div className="space-y-2">
                {recurring.map((r) => (
                  <div key={r.id} className={`flex items-center justify-between gap-3 rounded-md px-3 py-2 border transition-colors ${r.isActive ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-900/30 border-zinc-800 opacity-50'}`}>
                    {editingRecurring?.id === r.id ? (
                      <div className="flex flex-1 items-center gap-2 flex-wrap">
                        <input
                          value={editingRecurring.name}
                          onChange={(e) => setEditingRecurring(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="flex-1 min-w-24 rounded bg-zinc-700 border border-zinc-600 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-rose-500"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={(editingRecurring.amount / 100).toFixed(2)}
                          onChange={(e) => setEditingRecurring(prev => prev ? { ...prev, amount: Math.round(parseFloat(e.target.value) * 100) } : null)}
                          className="w-24 rounded bg-zinc-700 border border-zinc-600 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-rose-500"
                        />
                        <button onClick={() => {
                          updateRecurring({ id: r.id, data: { name: editingRecurring.name, amount: editingRecurring.amount } });
                          setEditingRecurring(null);
                        }} className="text-emerald-400 hover:text-emerald-300">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingRecurring(null)} className="text-zinc-500 hover:text-zinc-300">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-200 truncate">{r.name}</p>
                          <p className="text-xs text-zinc-500">{TRANSACTION_CATEGORY_LABELS[r.category as keyof typeof TRANSACTION_CATEGORY_LABELS]} · dia {r.dayOfMonth}</p>
                        </div>
                        <span className="text-sm font-semibold text-rose-400 shrink-0">{formatCurrency(r.amount)}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => updateRecurring({ id: r.id, data: { isActive: !r.isActive } })}
                            className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${r.isActive ? 'border-zinc-600 text-zinc-400 hover:border-rose-500 hover:text-rose-400' : 'border-zinc-700 text-zinc-600 hover:border-emerald-500 hover:text-emerald-400'}`}
                          >
                            {r.isActive ? 'Pausar' : 'Ativar'}
                          </button>
                          <button onClick={() => setEditingRecurring(r)} className="text-zinc-500 hover:text-zinc-300 p-1">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteRecurring(r.id)} className="text-zinc-500 hover:text-rose-400 p-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Botão lançar manualmente */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <p className="text-xs text-zinc-600">O lançamento automático ocorre todo dia 1º às 6h.</p>
              <Button
                variant="outline"
                size="sm"
                isLoading={isProcessing}
                onClick={() => processRecurring(undefined)}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Lançar agora
              </Button>
            </div>
            {processResult && (
              <p className="text-xs text-emerald-400">
                ✓ {processResult.created} transaç{processResult.created !== 1 ? 'ões' : 'ão'} lançada{processResult.created !== 1 ? 's' : ''} ({processResult.processed} recorrente{processResult.processed !== 1 ? 's' : ''} verificado{processResult.processed !== 1 ? 's' : ''}).
              </p>
            )}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <DateFilterBar value={dateFilter} onChange={setDateFilter} />
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="h-9 rounded-lg bg-zinc-800 border border-zinc-700 px-2 text-sm text-zinc-300 focus:outline-none focus:border-rose-500"
        >
          <option value="">Todos Profissionais</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-8">
        <StatCard
          title="Receitas"
          value={formatCurrency(totalIncome)}
          icon={<TrendingUp className="h-6 w-6" />}
          description={dateFilter ? 'No período selecionado' : 'Total bruto recebido'}
          className="bg-emerald-500/5 border-emerald-500/10"
        />
        <StatCard
          title="Despesas"
          value={formatCurrency(totalExpense)}
          icon={<TrendingDown className="h-6 w-6 text-rose-500" />}
          description={dateFilter ? 'No período selecionado' : 'Custos e materiais'}
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
              <TableHead className="hidden sm:table-cell">Categoria</TableHead>
              <TableHead className="hidden md:table-cell">Pagamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {formatDate(transaction.date)}
                  </TableCell>
                  <TableCell className="max-w-[140px] sm:max-w-none">
                    <span className="text-zinc-200 line-clamp-1">{transaction.description}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                      {TRANSACTION_CATEGORY_LABELS[transaction.category] || transaction.category}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-zinc-400 text-sm">
                      {transaction.paymentMethod ? PAYMENT_METHOD_LABELS[transaction.paymentMethod] : '—'}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right font-medium whitespace-nowrap ${
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
