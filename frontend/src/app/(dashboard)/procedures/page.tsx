'use client';

import { useState } from 'react';
import { useProcedures } from '@/hooks/use-procedures';
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
import { ProcedureModal } from '@/components/modals/procedure-modal';
import { formatCurrency } from '@/utils/format-currency';
import { Plus, Search, MoreVertical } from 'lucide-react';
import { Procedure } from '@/types/procedure.types';

export default function ProceduresPage() {
  const { procedures, isLoading } = useProcedures();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | undefined>();

  const filteredProcedures = procedures.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (procedure: Procedure) => {
    setSelectedProcedure(procedure);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedProcedure(undefined);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary italic:not-italic">Procedimentos</h1>
          <p className="text-content-secondary">
            Catálogo de serviços e base de preços
          </p>
        </div>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Procedimento
        </Button>
      </div>

      <Card>
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-edge bg-surface-primary px-3 py-2 focus-within:border-rose-500 transition-colors">
          <Search className="h-4 w-4 text-content-muted" />
          <input
            type="text"
            placeholder="Buscar procedimento..."
            className="flex-1 bg-transparent text-sm text-content-primary outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead className="text-center">Preço Sugerido</TableHead>
              <TableHead className="text-center">Duração</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton colSpan={4} />
            ) : filteredProcedures.length > 0 ? (
              filteredProcedures.map((procedure) => (
                <TableRow key={procedure.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-content-primary">{procedure.name}</span>
                      <span className="text-xs text-content-muted">{procedure.size} • {procedure.complexity}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium text-amber-800 dark:text-amber-400">
                    {formatCurrency(procedure.finalPrice)}
                  </TableCell>
                  <TableCell className="text-center text-content-secondary">
                    {procedure.duration} min
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(procedure)}
                    >
                      <MoreVertical className="h-4 w-4 text-content-muted" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableEmpty colSpan={4} />
            )}
          </TableBody>
        </Table>
      </Card>

      <ProcedureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        procedure={selectedProcedure}
      />
    </div>
  );
}
