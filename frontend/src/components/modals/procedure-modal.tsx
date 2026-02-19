'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useProcedures } from '@/hooks/use-procedures';
import { CreateProcedureData, Procedure } from '@/types/procedure.types';
import { useEffect } from 'react';
import { 
  TATTOO_SIZE_LABELS, 
  TATTOO_COMPLEXITY_LABELS, 
  BODY_LOCATION_LABELS 
} from '@/utils/constants';

const procedureSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional().or(z.literal('')),
  finalPrice: z.coerce.number().min(0, 'Preço deve ser maior ou igual a 0'),
  duration: z.coerce.number().min(0, 'Duração deve ser maior ou igual a 0'),
  size: z.string().min(1, 'Selecione o tamanho'),
  complexity: z.string().min(1, 'Selecione a complexidade'),
  bodyLocation: z.string().min(1, 'Selecione o local do corpo'),
});

type ProcedureFormData = z.infer<typeof procedureSchema>;

interface ProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  procedure?: Procedure;
}

export function ProcedureModal({ isOpen, onClose, procedure }: ProcedureModalProps) {
  const { createProcedure, updateProcedure, isCreating, isUpdating } = useProcedures();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProcedureFormData>({
    resolver: zodResolver(procedureSchema) as any,
  });

  useEffect(() => {
    if (procedure) {
      reset({
        name: procedure.name,
        description: procedure.description || '',
        finalPrice: procedure.finalPrice / 100, // Converte de centavos para R$ para exibição
        duration: procedure.duration,
        size: procedure.size,
        complexity: procedure.complexity,
        bodyLocation: procedure.bodyLocation,
      });
    } else {
      reset({
        name: '',
        description: '',
        finalPrice: 0,
        duration: 0,
        size: 'MEDIUM',
        complexity: 'MEDIUM',
        bodyLocation: 'ARM',
      });
    }
  }, [procedure, reset, isOpen]);

  const onSubmit = (data: ProcedureFormData) => {
    const formattedData = data as unknown as CreateProcedureData;
    if (procedure) {
      updateProcedure(
        { id: procedure.id, data: formattedData },
        {
          onSuccess: () => {
            onClose();
            reset();
          },
        }
      );
    } else {
      createProcedure(formattedData, {
        onSuccess: () => {
          onClose();
          reset();
        },
      });
    }
  };

  const sizeOptions = Object.entries(TATTOO_SIZE_LABELS).map(([value, label]) => ({ 
    value, 
    label: label as string 
  }));
  
  const complexityOptions = Object.entries(TATTOO_COMPLEXITY_LABELS).map(([value, label]) => ({ 
    value, 
    label: label as string 
  }));
  
  const bodyLocationOptions = Object.entries(BODY_LOCATION_LABELS).map(([value, label]) => ({ 
    value, 
    label: label as string 
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={procedure ? 'Editar Procedimento' : 'Novo Procedimento'}
    >
      <form onSubmit={handleSubmit((data) => onSubmit(data as ProcedureFormData))} className="space-y-4">
        <Input
          label="Nome do Procedimento"
          placeholder="Ex: Tatuagem Fineline"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Preço Sugerido (R$)"
            type="number"
            step="0.01"
            placeholder="Ex: 200,00"
            error={errors.finalPrice?.message}
            {...register('finalPrice')}
          />
          <Input
            label="Duração Estimada (minutos)"
            type="number"
            placeholder="Ex: 120"
            error={errors.duration?.message}
            {...register('duration')}
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
            {procedure ? 'Salvar Alterações' : 'Criar Procedimento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
