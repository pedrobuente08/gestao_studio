import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useClients } from '@/hooks/use-clients';
import {
  CreateClientData,
  Client,
  type ClientHearingSource,
  type UpdateClientData,
} from '@/types/client.types';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import { Trash2 } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { cn } from '@/lib/utils';
import { HEARING_SOURCE_OPTIONS } from '@/utils/client-hearing';

const hearingEnum = z.enum(['INSTAGRAM', 'GOOGLE', 'REFERRAL', 'YOUTUBE', 'OTHER']);

const clientSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  instagram: z.string().optional().or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  hearingSource: z.union([z.literal(''), hearingEnum]).optional(),
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
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { hearingSource: '' },
  });

  const hearingSource = watch('hearingSource') as ClientHearingSource | '' | undefined;

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
        hearingSource: (client.hearingSource ?? '') as ClientHearingSource | '',
      });
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        instagram: '',
        birthDate: '',
        notes: '',
        hearingSource: '',
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

  const toCreatePayload = (data: ClientFormData): CreateClientData => ({
    name: data.name,
    email: data.email || undefined,
    phone: data.phone || undefined,
    instagram: data.instagram || undefined,
    birthDate: data.birthDate || undefined,
    notes: data.notes || undefined,
    hearingSource: (() => {
      const v = data.hearingSource as ClientHearingSource | '' | undefined;
      if (v === undefined || v === '') return undefined;
      return v;
    })(),
  });

  const toUpdatePayload = (data: ClientFormData): UpdateClientData => ({
    ...toCreatePayload(data),
    hearingSource: (() => {
      const v = data.hearingSource as ClientHearingSource | '' | undefined;
      if (v === undefined || v === '') return null;
      return v;
    })(),
  });

  const onSubmit = (data: ClientFormData) => {
    setServerError(null);
    if (client) {
      updateClient(
        { id: client.id, data: toUpdatePayload(data) },
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
      createClient(toCreatePayload(data), {
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
              label="Data de nascimento (opcional)"
              type="date"
              error={errors.birthDate?.message}
              {...register('birthDate')}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-content-primary">Onde conheceu o estúdio?</p>
            <p className="text-xs text-content-muted">Opcional — ajuda a medir canais de divulgação.</p>
            <div
              className="flex flex-wrap gap-2 rounded-xl border border-edge bg-surface-primary p-2"
              role="tablist"
              aria-label="Onde conheceu o estúdio"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!hearingSource}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  !hearingSource
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30'
                    : 'text-content-secondary hover:bg-surface-elevated hover:text-content-primary',
                )}
                onClick={() => setValue('hearingSource', '', { shouldDirty: true })}
              >
                Não informado
              </button>
              {HEARING_SOURCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={hearingSource === opt.value}
                  className={cn(
                    'rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                    hearingSource === opt.value
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30'
                      : 'text-content-secondary hover:bg-surface-elevated hover:text-content-primary',
                  )}
                  onClick={() =>
                    setValue('hearingSource', opt.value, { shouldDirty: true })
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input type="hidden" {...register('hearingSource')} />
          </div>

          <Textarea
            label="Observações"
            placeholder="Informações relevantes sobre o cliente..."
            error={errors.notes?.message}
            {...register('notes')}
          />

          <div className="flex justify-between gap-3 pt-6 border-t border-edge">
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
                {client ? 'Salvar alterações' : 'Criar cliente'}
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
