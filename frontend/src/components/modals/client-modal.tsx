import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useClients } from '@/hooks/use-clients';
import { CreateClientData, Client } from '@/types/client.types';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';

const clientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  instagram: z.string().optional().or(z.literal('')),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  notes: z.string().optional().or(z.literal('')),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
}

export function ClientModal({ isOpen, onClose, client }: ClientModalProps) {
  const { createClient, updateClient, isCreating, isUpdating, createError, updateError } = useClients();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    setServerError(null);
    if (client) {
      reset({
        name: client.name,
        email: client.email || '',
        phone: client.phone || '',
        instagram: client.instagram || '',
        birthDate: client.birthDate ? new Date(client.birthDate).toISOString().split('T')[0] : '',
        notes: client.notes || '',
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        instagram: '',
        birthDate: '',
        notes: '',
      });
    }
  }, [client, reset, isOpen]);

  const onSubmit = (data: ClientFormData) => {
    setServerError(null);
    if (client) {
      updateClient(
        { id: client.id, data },
        {
          onSuccess: () => {
            onClose();
            reset();
          },
          onError: (error) => {
            if (error instanceof AxiosError) {
              setServerError(error.response?.data?.message || 'Erro ao atualizar cliente');
            }
          }
        }
      );
    } else {
      createClient(data as CreateClientData, {
        onSuccess: () => {
          onClose();
          reset();
        },
        onError: (error) => {
          if (error instanceof AxiosError) {
            setServerError(error.response?.data?.message || 'Erro ao criar cliente');
          }
        }
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
        {serverError && (
          <p className="text-sm font-medium text-red-500 bg-red-500/10 p-3 rounded-lg">
            {serverError}
          </p>
        )}

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Instagram (opcional)"
            placeholder="@usuario"
            error={errors.instagram?.message}
            {...register('instagram')}
          />
          <Input
            label="Data de Nascimento (opcional)"
            type="date"
            error={errors.birthDate?.message}
            {...register('birthDate')}
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
