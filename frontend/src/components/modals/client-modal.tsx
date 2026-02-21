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
import { Trash2 } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

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
  const { createClient, updateClient, removeClient, isCreating, isUpdating, isRemoving, createError, updateError } = useClients();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDelete = () => {
    if (client) {
      removeClient(client.id, {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          onClose();
        },
      });
    }
  };

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
    <>
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

          <div className="flex justify-between gap-3 pt-6 border-t border-zinc-800">
            {client ? (
              <Button
                type="button"
                variant="ghost"
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isRemoving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            ) : <div />}
            
            <div className="flex gap-3">
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
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Excluir Cliente"
        description="Tem certeza que deseja excluir este cliente? Todas as sessões e histórico deste cliente também serão removidos."
        isLoading={isRemoving}
      />
    </>
  );
}
