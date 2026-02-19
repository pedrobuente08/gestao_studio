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
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Clientes</h1>
          <p className="text-zinc-400">
            Gerencie sua base de clientes e histórico de sessões
          </p>
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

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
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden sm:table-cell">Contatos</TableHead>
              <TableHead className="text-center">Sessões</TableHead>
              <TableHead className="text-right">Total Gasto</TableHead>
              <TableHead className="hidden lg:table-cell">Última Visita</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton colSpan={6} />
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-200">{client.name}</span>
                        <span className="text-xs text-zinc-500 sm:hidden">
                          {client.email || 'Sem email'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex flex-col text-xs space-y-1">
                      <span className="text-zinc-400">{client.email || '-'}</span>
                      <span className="text-zinc-500">{client.phone || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {client.sessionCount || 0}
                  </TableCell>
                  <TableCell className="text-right font-medium text-amber-400">
                    {formatCurrency(client.totalSpent || 0)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-zinc-500">
                    {client.lastVisit ? formatRelativeDate(client.lastVisit) : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/clients/${client.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ExternalLink className="h-4 w-4 text-rose-500" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(client)}
                      >
                        <MoreVertical className="h-4 w-4 text-zinc-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableEmpty colSpan={6} />
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
