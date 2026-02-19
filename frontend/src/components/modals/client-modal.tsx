'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useClients } from '@/hooks/use-clients';
import { CreateClientData, Client } from '@/types/client.types';
import { useEffect } from 'react';

const clientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
}

export function ClientModal({ isOpen, onClose, client }: ClientModalProps) {
  const { createClient, updateClient, isCreating, isUpdating } = useClients();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        notes: client.notes || '',
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        notes: '',
      });
    }
  }, [client, reset, isOpen]);

  const onSubmit = (data: ClientFormData) => {
    if (client) {
      updateClient(
        { id: client.id, data },
        {
          onSuccess: () => {
            onClose();
            reset();
          },
        }
      );
    } else {
      createClient(data as CreateClientData, {
        onSuccess: () => {
          onClose();
          reset();
        },
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? 'Editar Cliente' : 'Novo Cliente'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nome completo"
          placeholder="Ex: João Silva"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Email (opcional)"
            type="email"
            placeholder="joao@email.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Telefone (opcional)"
            placeholder="(11) 99999-9999"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        <Textarea
          label="Observações"
          placeholder="Informações relevantes sobre o cliente..."
          error={errors.notes?.message}
          {...register('notes')}
        />

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
            {client ? 'Salvar Alterações' : 'Criar Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
