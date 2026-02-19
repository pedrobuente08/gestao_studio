'use client';

import { useParams, useRouter } from 'next/navigation';
import { useClients } from '@/hooks/use-clients';
import { useSessions } from '@/hooks/use-sessions';
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
import { formatCurrency } from '@/utils/format-currency';
import { formatDate } from '@/utils/format-date';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  MessageSquare,
  Edit
} from 'lucide-react';
import { useState } from 'react';
import { ClientModal } from '@/components/modals/client-modal';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { useClient } = useClients();
  const { data: client, isLoading: isLoadingClient } = useClient(id);
  const { sessions, isLoading: isLoadingSessions } = useSessions();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filtrar sessões deste cliente
  const clientSessions = sessions.filter(s => s.clientId === id);
  
  if (isLoadingClient) {
    return <div className="p-8"><p className="text-zinc-400">Carregando...</p></div>;
  }

  if (!client) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-400">Cliente não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header com Navegação */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{client.name}</h1>
          <p className="text-sm text-zinc-500">
            Cliente desde {formatDate(client.createdAt)}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-auto"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Coluna da Esquerda: Perfil */}
        <div className="space-y-6">
          <Card className="space-y-6">
            <div className="flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                <User className="h-12 w-12" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Mail className="h-4 w-4 text-zinc-500" />
                <span>{client.email || 'Não informado'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Phone className="h-4 w-4 text-zinc-500" />
                <span>{client.phone || 'Não informado'}</span>
              </div>
              {client.notes && (
                <div className="flex gap-3 text-sm text-zinc-300">
                  <MessageSquare className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                  <p className="italic text-zinc-400">"{client.notes}"</p>
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            <StatCard
              title="Total Investido"
              value={formatCurrency(client.totalSpent || 0)}
              icon={<DollarSign className="h-5 w-5" />}
              variant="highlight"
            />
            <StatCard
              title="Sessões"
              value={client.sessionCount || 0}
              icon={<Calendar className="h-5 w-5" />}
            />
          </div>
        </div>

        {/* Coluna da Direita: Histórico de Sessões */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-zinc-100 mb-6 italic:not-italic">Histórico de Sessões</h3>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSessions ? (
                  <TableSkeleton colSpan={4} />
                ) : clientSessions.length > 0 ? (
                  clientSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">
                        {formatDate(session.date)}
                      </TableCell>
                      <TableCell>
                        <span className="text-zinc-400">{session.procedure?.name || 'Tatuagem'}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-amber-400">
                        {formatCurrency(session.finalPrice)}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => router.push(`/sessions?id=${session.id}`)}
                        >
                          <Edit className="h-4 w-4 text-zinc-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty colSpan={4} message="Este cliente ainda não realizou sessões." />
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      <ClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        client={client}
      />
    </div>
  );
}
