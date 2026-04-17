'use client';

import { useState } from 'react';
import { useEmployees } from '@/hooks/use-employees';
import { EmployeeModal } from '@/components/modals/employee-modal';
import { Button } from '@/components/ui/button';
import { UserPlus, Pencil, Check, X, Trash2 } from 'lucide-react';

export default function EmployeesPage() {
  const { employees, isLoading, updateEmployee, deactivateEmployee, removeEmployee, isRemoving } = useEmployees();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPercentageId, setEditingPercentageId] = useState<string | null>(null);
  const [percentageInput, setPercentageInput] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const roleLabel = (role: string) =>
    role === 'STAFF' ? 'Staff' : 'Prestador';

  const handleEditPercentage = (empId: string, current: number | null) => {
    setEditingPercentageId(empId);
    setPercentageInput(current !== null ? String(current) : '');
  };

  const handleSavePercentage = (empId: string) => {
    const value = percentageInput.trim();
    const parsed = value === '' ? null : parseInt(value, 10);
    if (parsed !== null && (isNaN(parsed) || parsed < 0 || parsed > 100)) return;
    updateEmployee({ id: empId, data: { studioPercentage: parsed } });
    setEditingPercentageId(null);
  };

  const handleCancelPercentage = () => {
    setEditingPercentageId(null);
    setPercentageInput('');
  };

  const PercentageCell = ({ emp }: { emp: typeof employees[0] }) => (
    editingPercentageId === emp.id ? (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={100}
          value={percentageInput}
          onChange={(e) => setPercentageInput(e.target.value)}
          placeholder="Global"
          className="w-16 rounded bg-surface-elevated border border-edge-muted px-2 py-0.5 text-xs text-content-primary outline-none focus:border-rose-500"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSavePercentage(emp.id);
            if (e.key === 'Escape') handleCancelPercentage();
          }}
        />
        <span className="text-content-muted text-xs">%</span>
        <button onClick={() => handleSavePercentage(emp.id)} className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors">
          <Check className="h-3.5 w-3.5" />
        </button>
        <button onClick={handleCancelPercentage} className="text-content-muted hover:text-content-primary transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    ) : (
      <button
        onClick={() => handleEditPercentage(emp.id, emp.studioPercentage)}
        className="group flex items-center gap-1.5 text-xs text-content-secondary hover:text-content-primary transition-colors"
      >
        {emp.studioPercentage !== null
          ? <span className="font-medium text-rose-600 dark:text-rose-400">{emp.studioPercentage}%</span>
          : <span className="text-content-muted italic">Global</span>
        }
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    )
  );

  const toggleStatus = (emp: typeof employees[0]) =>
    emp.status === 'ACTIVE'
      ? deactivateEmployee(emp.id)
      : updateEmployee({ id: emp.id, data: { status: 'ACTIVE' } });

  const handleDeleteConfirm = (id: string) => {
    removeEmployee(id, { onSuccess: () => setConfirmDeleteId(null) });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-content-primary sm:text-3xl">Prestadores</h1>
          <p className="text-sm text-content-secondary">Gerencie sua equipe e convide novos prestadores.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Prestador
        </Button>
      </div>

      {/* Mobile: cards */}
      <div className="sm:hidden space-y-3">
        {isLoading && (
          <p className="text-center text-content-muted italic py-6">Carregando prestadores...</p>
        )}
        {!isLoading && employees.length === 0 && (
          <p className="text-center text-content-muted italic py-6">Nenhum prestador cadastrado.</p>
        )}
        {employees.map((emp) => (
          <div key={emp.id} className="rounded-lg border border-edge bg-surface-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-content-primary truncate">{emp.name}</p>
                <p className="text-xs text-content-muted truncate mt-0.5">{emp.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`flex items-center gap-1 text-xs font-medium ${emp.status === 'ACTIVE' ? 'text-green-700 dark:text-green-400' : 'text-content-muted'}`}>
                  <small className={`h-1.5 w-1.5 rounded-full ${emp.status === 'ACTIVE' ? 'bg-green-600 dark:bg-green-400' : 'bg-content-muted'}`} />
                  {emp.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-content-secondary">
              <div className="flex items-center gap-1.5">
                <span className="text-content-muted">Cargo:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                  emp.role === 'STAFF' ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20' : 'bg-surface-elevated text-content-secondary'
                }`}>
                  {roleLabel(emp.role)}
                </span>
              </div>
              {emp.serviceType && (
                <div className="flex items-center gap-1.5">
                  <span className="text-content-muted">Serviço:</span>
                  <span className="text-content-primary">{emp.serviceType.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-content-muted">% Studio:</span>
                <PercentageCell emp={emp} />
              </div>
            </div>

            <div className="pt-1 border-t border-edge space-y-2">
              <button
                onClick={() => toggleStatus(emp)}
                className="text-xs font-medium text-content-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors bg-surface-primary/50 hover:bg-rose-500/10 px-3 py-1.5 rounded-md border border-edge hover:border-rose-500/20 w-full"
              >
                {emp.status === 'ACTIVE' ? 'Desativar prestador' : 'Reativar prestador'}
              </button>
              {emp.status === 'INACTIVE' && (
                confirmDeleteId === emp.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-content-secondary flex-1">Excluir permanentemente?</span>
                    <button
                      onClick={() => handleDeleteConfirm(emp.id)}
                      disabled={isRemoving}
                      className="text-xs font-medium text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 px-2 py-1 rounded border border-rose-500/30 hover:border-rose-500/60 transition-colors"
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs font-medium text-content-muted hover:text-content-primary px-2 py-1 rounded border border-edge-muted transition-colors"
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(emp.id)}
                    className="flex items-center justify-center gap-1.5 text-xs font-medium text-content-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors w-full px-3 py-1.5 rounded-md border border-edge hover:border-rose-500/20 hover:bg-rose-500/5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir prestador
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: tabela */}
      <div className="hidden sm:block rounded-lg border border-edge overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-card/50 text-content-secondary">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Serviço</th>
              <th className="text-left px-4 py-3 font-medium">Cargo</th>
              <th className="text-left px-4 py-3 font-medium">% Studio</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-edge bg-surface-primary/30">
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-content-muted italic">Carregando prestadores...</td></tr>
            )}
            {!isLoading && employees.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-content-muted italic">Nenhum prestador cadastrado.</td></tr>
            )}
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-surface-card/30 transition-colors">
                <td className="px-4 py-3 font-medium text-content-primary">{emp.name}</td>
                <td className="px-4 py-3 text-content-secondary max-w-[160px] truncate">{emp.email}</td>
                <td className="px-4 py-3 text-content-primary hidden md:table-cell">
                  {emp.serviceType?.name ?? <span className="text-content-muted italic">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                    emp.role === 'STAFF' ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20' : 'bg-surface-elevated text-content-secondary'
                  }`}>
                    {roleLabel(emp.role)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <PercentageCell emp={emp} />
                </td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${emp.status === 'ACTIVE' ? 'text-green-700 dark:text-green-400' : 'text-content-muted'}`}>
                    <small className={`h-1.5 w-1.5 rounded-full ${emp.status === 'ACTIVE' ? 'bg-green-600 dark:bg-green-400 shadow-[0_0_8px_rgba(22,163,74,0.45)] dark:shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-content-muted'}`} />
                    {emp.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {emp.status === 'INACTIVE' && (
                      confirmDeleteId === emp.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-content-secondary">Excluir?</span>
                          <button
                            onClick={() => handleDeleteConfirm(emp.id)}
                            disabled={isRemoving}
                            className="text-xs font-medium text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 px-2 py-1 rounded border border-rose-500/30 hover:border-rose-500/60 transition-colors"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs font-medium text-content-muted hover:text-content-primary px-2 py-1 rounded border border-edge-muted transition-colors"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(emp.id)}
                          className="text-content-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 rounded hover:bg-rose-500/10"
                          title="Excluir prestador"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )
                    )}
                    <button
                      onClick={() => toggleStatus(emp)}
                      className="text-xs font-medium text-content-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors bg-surface-card/50 hover:bg-rose-500/10 px-3 py-1 rounded-md border border-edge hover:border-rose-500/20"
                    >
                      {emp.status === 'ACTIVE' ? 'Desativar' : 'Reativar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-content-muted">
        <span className="text-rose-600 dark:text-rose-400 font-medium">% Studio</span> — Percentual individual que o studio retém dos atendimentos deste prestador. Quando em branco, usa o percentual global definido na Calculadora.
      </p>

      <EmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
