'use client';

import { useState } from 'react';
import { useEmployees } from '@/hooks/use-employees';
import { EmployeeModal } from '@/components/modals/employee-modal';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

export default function EmployeesPage() {
  const { employees, isLoading, updateEmployee, deactivateEmployee } = useEmployees();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const roleLabel = (role: string) =>
    role === 'STAFF' ? 'Staff' : 'Prestador';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-zinc-100">Prestadores</h1>
          <p className="text-sm text-zinc-400">Gerencie sua equipe e convide novos prestadores.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Prestador
        </Button>
      </div>

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/50 text-zinc-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Serviço</th>
              <th className="text-left px-4 py-3 font-medium">Cargo</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Email Verificado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-950/30">
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-zinc-500 italic">Carregando prestadores...</td></tr>
            )}
            {!isLoading && employees.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-zinc-500 italic">Nenhum prestador cadastrado.</td></tr>
            )}
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-3 font-medium text-zinc-200">{emp.name}</td>
                <td className="px-4 py-3 text-zinc-400">{emp.email}</td>
                <td className="px-4 py-3 text-zinc-300">
                  {emp.serviceType?.name ?? <span className="text-zinc-600 italic">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                    emp.role === 'STAFF' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {roleLabel(emp.role)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${
                    emp.status === 'ACTIVE' ? 'text-green-400' : 'text-zinc-500'
                  }`}>
                    <small className={`h-1.5 w-1.5 rounded-full ${emp.status === 'ACTIVE' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-zinc-600'}`} />
                    {emp.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {emp.emailVerified
                    ? <span className="text-green-400/80 text-xs">Sim</span>
                    : <span className="text-amber-500/80 text-xs">Pendente</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      emp.status === 'ACTIVE'
                        ? deactivateEmployee(emp.id)
                        : updateEmployee({ id: emp.id, data: { status: 'ACTIVE' } })
                    }
                    className="text-xs font-medium text-zinc-500 hover:text-rose-400 transition-colors bg-zinc-900/50 hover:bg-rose-500/10 px-3 py-1 rounded-md border border-zinc-800 hover:border-rose-500/20"
                  >
                    {emp.status === 'ACTIVE' ? 'Desativar' : 'Reativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
