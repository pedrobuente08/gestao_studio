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
import { useProcedures } from '@/hooks/use-procedures';
import { CreateSessionData, TattooSession } from '@/types/session.types';
import { useEffect, useState } from 'react';
import { 
  TATTOO_SIZE_LABELS, 
  TATTOO_COMPLEXITY_LABELS, 
  BODY_LOCATION_LABELS,
  PAYMENT_METHOD_LABELS
} from '@/utils/constants';

const sessionSchema = z.object({
  clientId: z.string().min(1, 'Selecione um cliente'),
  procedureId: z.string().min(1, 'Selecione um procedimento'),
  date: z.string().min(1, 'Selecione a data'),
  size: z.string().min(1, 'Selecione o tamanho'),
  complexity: z.string().min(1, 'Selecione a complexidade'),
  bodyLocation: z.string().min(1, 'Selecione o local do corpo'),
  finalPrice: z.coerce.number().min(0, 'Preço deve ser maior ou igual a 0'),
  description: z.string().optional().or(z.literal('')),
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
  const { procedures } = useProcedures();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema) as any,
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    }
  });

  const selectedProcedureId = watch('procedureId');

  // Atualiza o preço final quando o procedimento muda
  useEffect(() => {
    if (selectedProcedureId && !session) {
      const procedure = procedures.find(p => p.id === selectedProcedureId);
      if (procedure) {
        setValue('finalPrice', procedure.finalPrice);
      }
    }
  }, [selectedProcedureId, procedures, setValue, session]);

  useEffect(() => {
    if (session) {
      reset({
        clientId: session.clientId,
        procedureId: session.procedureId || '',
        date: session.date.split('T')[0],
        size: session.size,
        complexity: session.complexity,
        bodyLocation: session.bodyLocation,
        finalPrice: session.finalPrice,
        description: session.description || '',
      });
    } else {
      reset({
        clientId: '',
        procedureId: '',
        date: new Date().toISOString().split('T')[0],
        size: 'MEDIUM',
        complexity: 'MEDIUM',
        bodyLocation: 'ARM',
        finalPrice: 0,
        description: '',
      });
    }
  }, [session, reset, isOpen]);

  const onSubmit = (data: SessionFormData) => {
    const formattedData = data as unknown as CreateSessionData;
    if (session) {
      updateSession(
        { id: session.id, data: formattedData },
        {
          onSuccess: () => {
            onClose();
            reset();
          },
        }
      );
    } else {
      createSession(formattedData, {
        onSuccess: () => {
          onClose();
          reset();
        },
      });
    }
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));
  const procedureOptions = procedures.map(p => ({ value: p.id, label: p.name }));
  
  const sizeOptions = Object.entries(TATTOO_SIZE_LABELS).map(([value, label]) => ({ value, label }));
  const complexityOptions = Object.entries(TATTOO_COMPLEXITY_LABELS).map(([value, label]) => ({ value, label }));
  const bodyLocationOptions = Object.entries(BODY_LOCATION_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={session ? 'Editar Sessão' : 'Nova Sessão'}
    >
      <form onSubmit={handleSubmit((data) => onSubmit(data as SessionFormData))} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Cliente"
            placeholder="Selecione um cliente"
            options={clientOptions}
            error={errors.clientId?.message}
            {...register('clientId')}
          />
          <Select
            label="Procedimento"
            placeholder="Selecione um serviço"
            options={procedureOptions}
            error={errors.procedureId?.message}
            {...register('procedureId')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Data"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />
          <Input
            label="Preço Final (centavos)"
            type="number"
            error={errors.finalPrice?.message}
            {...register('finalPrice')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Tamanho"
            options={sizeOptions}
            error={errors.size?.message}
            {...register('size')}
          />
          <Select
            label="Complexidade"
            options={complexityOptions}
            error={errors.complexity?.message}
            {...register('complexity')}
          />
          <Select
            label="Local"
            options={bodyLocationOptions}
            error={errors.bodyLocation?.message}
            {...register('bodyLocation')}
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
            {session ? 'Salvar Alterações' : 'Finalizar Sessão'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
