'use client';

import { useState } from 'react';
import { useServiceTypes } from '@/hooks/use-service-types';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export default function ServiceTypesPage() {
  const { serviceTypes, isLoading, createServiceType, removeServiceType, isCreating } = useServiceTypes();
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    createServiceType({ name: newName.trim() }, { onSuccess: () => setNewName('') });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Tipos de Serviço</h1>

      {/* Form de adição */}
      <div className="flex gap-3">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Ex: Micropigmentação, Dermopigmentação..."
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-rose-500"
        />
        <Button onClick={handleAdd} isLoading={isCreating} disabled={!newName.trim()}>
          Adicionar
        </Button>
      </div>

      {/* Lista */}
      <div className="rounded-lg border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
        {isLoading && (
          <p className="p-4 text-sm text-zinc-500">Carregando...</p>
        )}
        {!isLoading && serviceTypes.length === 0 && (
          <p className="p-4 text-sm text-zinc-500 text-center">Nenhum tipo de serviço cadastrado.</p>
        )}
        {serviceTypes.map((type) => (
          <div key={type.id} className="flex items-center justify-between px-4 py-3 bg-zinc-950">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-100">{type.name}</span>
              {type.isSystem && (
                <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                  Sistema
                </span>
              )}
            </div>
            {!type.isSystem && (
              <button
                onClick={() => {
                  if (confirm('Deseja excluir este tipo de serviço?')) {
                    removeServiceType(type.id);
                  }
                }}
                className="p-2 text-zinc-500 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
