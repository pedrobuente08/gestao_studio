'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSessions } from '@/hooks/use-sessions';
import { useClients } from '@/hooks/use-clients';
import { useServiceTypes } from '@/hooks/use-service-types';
import { useAuthStore } from '@/stores/auth.store';
import { CreateSessionData, TattooSession } from '@/types/session.types';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  TATTOO_SIZE_LABELS,
  TATTOO_COMPLEXITY_LABELS,
  BODY_LOCATION_LABELS,
} from '@/utils/constants';

const sessionSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  serviceTypeId: z.string().min(1, 'Selecione o tipo de serviço'),
  date: z.string().min(1, 'Selecione a data'),
  finalPrice: z.coerce.number().min(0, 'Preço deve ser maior ou igual a 0'),
  description: z.string().optional().or(z.literal('')),
  size: z.string().optional(),
  complexity: z.string().optional(),
  bodyLocation: z.string().optional(),
  duration: z.coerce.number().optional(),
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: TattooSession;
}

export function SessionModal({ isOpen, onClose, session }: SessionModalProps) {
  const { createSession, updateSession, isCreating, isUpdating } = useSessions();
  const { clients } = useClients();
  const { serviceTypes, createServiceType, isCreating: isCreatingType } = useServiceTypes();
  const { user } = useAuthStore();
  const [newTypeName, setNewTypeName] = useState('');
  const [showNewType, setShowNewType] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema) as any,
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const selectedServiceTypeId = watch('serviceTypeId');
  const selectedServiceType = serviceTypes.find(t => t.id === selectedServiceTypeId);
  const isTattoo = selectedServiceType?.name === 'Tatuagem';

  useEffect(() => {
    if (session) {
      reset({
        clientId: session.clientId,
        serviceTypeId: session.serviceTypeId || '',
        date: session.date.split('T')[0],
        size: session.size || '',
        complexity: session.complexity || '',
        bodyLocation: session.bodyLocation || '',
        // Converte de centavos para R$ para exibição
        finalPrice: session.finalPrice / 100,
        description: session.description || '',
        duration: session.duration || undefined,
      });
    } else {
      reset({
        clientId: '',
        serviceTypeId: '',
        date: new Date().toISOString().split('T')[0],
        size: '',
        complexity: '',
        bodyLocation: '',
        finalPrice: 0,
        description: '',
        duration: undefined,
      });
    }
  }, [session, reset, isOpen]);

  const handleAddNewType = () => {
    if (!newTypeName.trim()) return;
    createServiceType({ name: newTypeName.trim() }, {
      onSuccess: () => {
        setNewTypeName('');
        setShowNewType(false);
      },
    });
  };

  const onSubmit = (data: SessionFormData) => {
    const payload: CreateSessionData = {
      clientId: data.clientId,
      userId: user?.id || '',
      serviceTypeId: data.serviceTypeId,
      date: data.date,
      finalPrice: data.finalPrice, // em R$, backend converte para centavos
      description: data.description || undefined,
      duration: data.duration || undefined,
      size: isTattoo && data.size ? (data.size as any) : undefined,
      complexity: isTattoo && data.complexity ? (data.complexity as any) : undefined,
      bodyLocation: isTattoo && data.bodyLocation ? (data.bodyLocation as any) : undefined,
    };

    if (session) {
      updateSession(
        { id: session.id, data: payload },
        {
          onSuccess: () => {
            onClose();
            reset();
          },
        }
      );
    } else {
      createSession(payload, {
        onSuccess: () => {
          onClose();
          reset();
        },
      });
    }
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));
  const serviceTypeOptions = serviceTypes.map(t => ({ value: t.id, label: t.name }));
  const sizeOptions = Object.entries(TATTOO_SIZE_LABELS).map(([value, label]) => ({ value, label }));
  const complexityOptions = Object.entries(TATTOO_COMPLEXITY_LABELS).map(([value, label]) => ({ value, label }));
  const bodyLocationOptions = Object.entries(BODY_LOCATION_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={session ? 'Editar Procedimento' : 'Novo Procedimento'}
    >
      <form onSubmit={handleSubmit((data) => onSubmit(data as SessionFormData))} className="space-y-4">
        {/* Cliente */}
        <Select
          label="Cliente"
          placeholder="Selecione um cliente"
          options={clientOptions}
          error={errors.clientId?.message}
          {...register('clientId')}
        />

        {/* Tipo de Serviço */}
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Select
                label="Tipo de Serviço"
                placeholder="Selecione o tipo"
                options={serviceTypeOptions}
                error={errors.serviceTypeId?.message}
                {...register('serviceTypeId')}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mb-0.5 shrink-0"
              onClick={() => setShowNewType(!showNewType)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {showNewType && (
            <div className="flex gap-2 items-center rounded-lg border border-zinc-700 bg-zinc-900 p-3">
              <input
                type="text"
                placeholder="Nome do novo tipo (ex: Micropigmentação)"
                className="flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder-zinc-500"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewType())}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddNewType}
                isLoading={isCreatingType}
              >
                Adicionar
              </Button>
            </div>
          )}
        </div>

        {/* Campos condicionais de tatuagem */}
        {isTattoo && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Tamanho"
              placeholder="Selecione"
              options={sizeOptions}
              error={errors.size?.message}
              {...register('size')}
            />
            <Select
              label="Complexidade"
              placeholder="Selecione"
              options={complexityOptions}
              error={errors.complexity?.message}
              {...register('complexity')}
            />
            <Select
              label="Local do Corpo"
              placeholder="Selecione"
              options={bodyLocationOptions}
              error={errors.bodyLocation?.message}
              {...register('bodyLocation')}
            />
          </div>
        )}

        {/* Data e Preço */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Data"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />
          <Input
            label="Valor Cobrado (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            error={errors.finalPrice?.message}
            {...register('finalPrice')}
          />
        </div>

        {/* Duração e Descrição */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Duração (minutos)"
            type="number"
            placeholder="Ex: 120"
            {...register('duration')}
          />
          <Input
            label="Descrição"
            placeholder="Ex: Blackwork no antebraço"
            {...register('description')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isCreating || isUpdating}
          >
            Cancelar
          </Button>
          <Button type="submit" isLoading={isCreating || isUpdating}>
            {session ? 'Salvar Alterações' : 'Registrar Procedimento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
