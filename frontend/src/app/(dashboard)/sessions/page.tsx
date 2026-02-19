'use client';

import { useState } from 'react';
import { useSessions } from '@/hooks/use-sessions';
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
import { SessionModal } from '@/components/modals/session-modal';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/format-date';
import { Plus, Search, MoreVertical, User, Scissors } from 'lucide-react';
import { TattooSession } from '@/types/session.types';

export default function ProcedimentosPage() {
  const { sessions, isLoading } = useSessions();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TattooSession | undefined>();

  const filteredSessions = sessions.filter((s) =>
    s.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.serviceType?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (session: TattooSession) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedSession(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Procedimentos</h1>
          <p className="text-zinc-400">
            Histórico de trabalhos realizados
          </p>
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Procedimento
        </Button>
      </div>

      <Card>
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 focus-within:border-rose-500 transition-colors">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por cliente, tipo de serviço ou descrição..."
            className="flex-1 bg-transparent text-sm text-zinc-100 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo de Serviço</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton colSpan={5} />
            ) : filteredSessions.length > 0 ? (
              filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {formatDate(session.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-200">{session.client?.name || 'Cliente'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-400">
                        {session.serviceType?.name || session.procedure?.name || 'Tatuagem'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-amber-400">
                    {formatCurrency(session.finalPrice)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(session)}
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

      <SessionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        session={selectedSession}
      />
    </div>
  );
}
