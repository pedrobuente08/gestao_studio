'use client';

import { useState, useMemo } from 'react';
import { useSessions } from '@/hooks/use-sessions';
import { useServiceTypes } from '@/hooks/use-service-types';
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
import { PageHeader } from '@/components/ui/page-header';
import { DateFilterBar, DateFilter } from '@/components/ui/date-filter-bar';
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/format-date';
import { Plus, Search, MoreVertical, User, Scissors } from 'lucide-react';
import { TattooSession } from '@/types/session.types';

export default function ProcedimentosPage() {
  const { sessions, isLoading } = useSessions();
  const { serviceTypes } = useServiceTypes();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter | null>(null);
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TattooSession | undefined>();

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Busca textual: apenas nome do cliente e nome do tipo de serviço (não descrição)
      const matchesSearch =
        !searchTerm ||
        (s.client?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (s.serviceType?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

      // Filtro por tipo de serviço via dropdown
      const matchesServiceType =
        !selectedServiceTypeId || s.serviceType?.id === selectedServiceTypeId;

      // Filtro por data
      let matchesDate = true;
      if (dateFilter) {
        const sessionDate = new Date(s.date).toISOString().split('T')[0];
        matchesDate = sessionDate >= dateFilter.startDate && sessionDate <= dateFilter.endDate;
      }

      return matchesSearch && matchesServiceType && matchesDate;
    });
  }, [sessions, searchTerm, selectedServiceTypeId, dateFilter]);

  const handleEdit = (session: TattooSession) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedSession(undefined);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    const headers = ['Data', 'Cliente', 'Serviço', 'Valor', 'Descrição'];
    const csvContent = [
      headers.join(','),
      ...filteredSessions.map(s => [
        s.date,
        s.client?.name || 'Comum',
        s.serviceType?.name || 'Outro',
        (s.finalPrice / 100).toFixed(2),
        `"${s.description || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `procedimentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Procedimentos"
        description="Histórico de trabalhos realizados"
      >
        <Button variant="ghost" onClick={handleExport} className="hidden sm:flex text-zinc-400 hover:text-zinc-100">
          Exportar CSV
        </Button>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Procedimento
        </Button>
      </PageHeader>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <DateFilterBar value={dateFilter} onChange={setDateFilter} />
        <select
          value={selectedServiceTypeId}
          onChange={(e) => setSelectedServiceTypeId(e.target.value)}
          className="h-8 rounded-lg bg-zinc-800 border border-zinc-700 px-2 text-sm text-zinc-300 focus:outline-none focus:border-rose-500"
        >
          <option value="">Todos os tipos</option>
          {serviceTypes.map((st) => (
            <option key={st.id} value={st.id}>{st.name}</option>
          ))}
        </select>
      </div>

      <Card>
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 focus-within:border-rose-500 transition-colors">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por cliente ou tipo de serviço..."
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
              <TableHead>Serviço</TableHead>
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
                      <span className="text-zinc-200">{session.client?.name || 'Comum'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-zinc-500" />
                      <span className="text-zinc-400">{session.serviceType?.name || 'Outro'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-zinc-100">
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
