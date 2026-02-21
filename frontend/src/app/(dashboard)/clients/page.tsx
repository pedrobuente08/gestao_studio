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
import { Plus, Search, User, MoreVertical, ExternalLink } from 'lucide-react';
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Clientes"
        description="Gerencie sua base de clientes e histórico de sessões"
      >
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </PageHeader>

      <Card>
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 focus-within:border-rose-500 transition-colors">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            className="flex-1 bg-transparent text-sm text-zinc-100 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

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

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        client={selectedClient}
      />
    </div>
  );
}
