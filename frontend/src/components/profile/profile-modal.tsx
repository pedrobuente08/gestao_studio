'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

// ─── Studio Profile Form ──────────────────────────────────────────────────────

const studioSchema = z.object({
  name: z.string().min(1, 'Campo obrigatório'),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  zipCode: z.string().optional(),
  instagram: z.string().optional(),
  phone: z.string().optional(),
});

type StudioFormData = z.infer<typeof studioSchema>;

function StudioProfileForm({ onClose }: { onClose: () => void }) {
  const { user, updateTenantAsync, isUpdateTenantLoading } = useAuth();
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<StudioFormData>({
    resolver: zodResolver(studioSchema),
    defaultValues: {
      name: user?.studio?.name ?? '',
      cnpj: user?.studio?.cnpj ?? '',
      address: user?.studio?.address ?? '',
      zipCode: user?.studio?.zipCode ?? '',
      instagram: user?.studio?.instagram ?? '',
      phone: user?.studio?.phone ?? '',
    },
  });

  const onSubmit = async (data: StudioFormData) => {
    await updateTenantAsync(data);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {success && (
        <div className="rounded-lg bg-green-500/10 p-3 text-center text-sm text-green-400">
          Dados do estúdio atualizados!
        </div>
      )}

      <Input
        label="Nome do estúdio"
        placeholder="Nome do estúdio"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="CNPJ"
        placeholder="00.000.000/0000-00"
        error={errors.cnpj?.message}
        {...register('cnpj')}
      />

      <Input
        label="Endereço"
        placeholder="Rua, número, bairro"
        error={errors.address?.message}
        {...register('address')}
      />

      <Input
        label="CEP"
        placeholder="00000-000"
        error={errors.zipCode?.message}
        {...register('zipCode')}
      />

      <Input
        label="Instagram (@)"
        placeholder="@seuestudio"
        error={errors.instagram?.message}
        {...register('instagram')}
      />

      <Input
        label="Celular da empresa"
        placeholder="(11) 99999-9999"
        error={errors.phone?.message}
        {...register('phone')}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" isLoading={isUpdateTenantLoading}>
          Salvar
        </Button>
      </div>
    </form>
  );
}

// ─── Personal Profile Form ────────────────────────────────────────────────────

const personalSchema = z.object({
  name: z.string().min(1, 'Campo obrigatório'),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  instagram: z.string().optional(),
  phone: z.string().optional(),
});

type PersonalFormData = z.infer<typeof personalSchema>;

function PersonalProfileForm({ onClose }: { onClose: () => void }) {
  const { user, updateProfileAsync, isUpdateProfileLoading } = useAuth();
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      name: user?.name ?? '',
      birthDate: user?.birthDate ? user.birthDate.slice(0, 10) : '',
      gender: user?.gender ?? '',
      instagram: user?.instagram ?? '',
      phone: user?.phone ?? '',
    },
  });

  const onSubmit = async (data: PersonalFormData) => {
    await updateProfileAsync(data);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {success && (
        <div className="rounded-lg bg-green-500/10 p-3 text-center text-sm text-green-400">
          Perfil atualizado!
        </div>
      )}

      <Input
        label="Nome"
        placeholder="Seu nome"
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Data de nascimento"
        type="date"
        error={errors.birthDate?.message}
        {...register('birthDate')}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">Gênero</label>
        <select
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
          {...register('gender')}
        >
          <option value="">Prefiro não informar</option>
          <option value="Masculino">Masculino</option>
          <option value="Feminino">Feminino</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      <Input
        label="Instagram (@)"
        placeholder="@seuperfil"
        error={errors.instagram?.message}
        {...register('instagram')}
      />

      <Input
        label="Celular"
        placeholder="(11) 99999-9999"
        error={errors.phone?.message}
        {...register('phone')}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" isLoading={isUpdateProfileLoading}>
          Salvar
        </Button>
      </div>
    </form>
  );
}

// ─── Change Password Form ─────────────────────────────────────────────────────

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Campo obrigatório'),
    newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme a senha'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

function ChangePasswordForm() {
  const { changePasswordAsync, isChangePasswordLoading, changePasswordError } = useAuth();
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    await changePasswordAsync({ currentPassword: data.currentPassword, newPassword: data.newPassword });
    setSuccess(true);
    reset();
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {success && (
        <div className="rounded-lg bg-green-500/10 p-3 text-center text-sm text-green-400">
          Senha alterada com sucesso!
        </div>
      )}
      {changePasswordError && (
        <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-500">
          {(changePasswordError as any)?.response?.data?.message || 'Erro ao alterar senha'}
        </div>
      )}

      <Input
        label="Senha atual"
        type="password"
        placeholder="••••••••"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <Input
        label="Nova senha"
        type="password"
        placeholder="••••••••"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Input
        label="Confirmar nova senha"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <Button type="submit" className="w-full" isLoading={isChangePasswordLoading}>
        Alterar senha
      </Button>
    </form>
  );
}

// ─── Profile Modal ─────────────────────────────────────────────────────────────

type Tab = 'profile' | 'password';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: Tab;
}

export function ProfileModal({ isOpen, onClose, initialTab = 'profile' }: ProfileModalProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab);

  // Sync tab when modal opens with a specific initialTab
  useEffect(() => {
    if (isOpen) setTab(initialTab);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const isStudioOwner = user?.tenantType === 'STUDIO' && user?.role === 'OWNER';
  const title = isStudioOwner ? 'Perfil do Estúdio' : 'Meu Perfil';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-lg bg-zinc-800/50 p-1">
        <button
          type="button"
          onClick={() => setTab('profile')}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
            tab === 'profile'
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {isStudioOwner ? 'Estúdio' : 'Dados pessoais'}
        </button>
        <button
          type="button"
          onClick={() => setTab('password')}
          className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
            tab === 'password'
              ? 'bg-zinc-700 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Alterar senha
        </button>
      </div>

      {tab === 'profile' ? (
        isStudioOwner ? (
          <StudioProfileForm onClose={onClose} />
        ) : (
          <PersonalProfileForm onClose={onClose} />
        )
      ) : (
        <ChangePasswordForm />
      )}
    </Modal>
  );
}
