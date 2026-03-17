'use client';

import { useState } from 'react';
import { useClients } from '@/hooks/use-clients';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { ClientModal } from '@/components/modals/client-modal';
import { PageHeader } from '@/components/ui/page-header';
import { formatCurrency } from '@/utils/format-currency';
import { formatRelativeDate } from '@/utils/format-date';
import { Plus, Search, User, MoreVertical, ExternalLink, Download } from 'lucide-react';
import Link from 'next/link';
import { Client } from '@/types/client.types';

export default function ClientsPage() {
  const { clients, isLoading } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedClient(undefined);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Nome', 'Email', 'Telefone', 'Instagram'],
      ...filteredClients.map((c) => [
        c.name ?? '',
        c.email ?? '',
        c.phone ?? '',
        c.instagram ?? '',
      ]),
    ];
    const csv = rows
      .map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Clientes"
        description="Gerencie sua base de clientes e histórico de sessões"
      >
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={filteredClients.length === 0}
            className="flex-1 sm:flex-none"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Base de Clientes
          </Button>
          <Button onClick={handleAdd} className="flex-1 sm:flex-none">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </PageHeader>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 focus-within:border-rose-500 transition-colors">
        <Search className="h-4 w-4 text-zinc-500 shrink-0" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          className="flex-1 bg-transparent text-sm text-zinc-100 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Mobile: cards */}
      <div className="sm:hidden space-y-3">
        {isLoading && (
          <p className="text-center text-zinc-500 italic py-6">Carregando clientes...</p>
        )}
        {!isLoading && filteredClients.length === 0 && (
          <p className="text-center text-zinc-500 italic py-6">Nenhum cliente encontrado.</p>
        )}
        {filteredClients.map((client) => (
          <div key={client.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-zinc-100 truncate">{client.name}</p>
                  {client.instagram && (
                    <p className="text-xs text-zinc-500 truncate">{client.instagram}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                onClick={() => handleEdit(client)}
              >
                <MoreVertical className="h-4 w-4 text-zinc-500" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-0.5">
                <p className="text-zinc-600 uppercase tracking-wide text-[10px]">Contato</p>
                <p className="text-zinc-300">{client.phone || '—'}</p>
                <p className="text-zinc-500">{client.email || '—'}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-zinc-600 uppercase tracking-wide text-[10px]">Última Sessão</p>
                <p className="text-zinc-300">
                  {client.lastVisit ? formatRelativeDate(client.lastVisit) : 'Nunca'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
              <span className="text-xs text-zinc-500">Total investido</span>
              <span className="text-sm font-semibold text-emerald-400">
                {formatCurrency(client.totalSpent || 0)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden sm:block">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Última Sessão</TableHead>
                <TableHead className="text-right">Total Investido</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton colSpan={5} />
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                          <User className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-zinc-200">{client.name}</span>
                          {client.instagram && (
                            <span className="text-xs text-zinc-500">{client.instagram}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-zinc-400 text-sm">{client.phone || 'Sem telefone'}</span>
                        <span className="text-zinc-500 text-xs">{client.email || 'Sem email'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-zinc-400 text-sm">
                        {client.lastVisit ? formatRelativeDate(client.lastVisit) : 'Nunca'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-500">
                      {formatCurrency(client.totalSpent || 0)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(client)}
                      >
                        <MoreVertical className="h-4 w-4 text-zinc-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableEmpty colSpan={5} />
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={selectedClient}
      />
    </div>
  );
}
