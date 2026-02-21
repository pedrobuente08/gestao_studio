'use client';

import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Select } from '../ui/select';
import * as Avatar from '@radix-ui/react-avatar';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  age: z.number().int().positive().nullable().optional(),
  gender: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user, updateProfile, isUpdateProfileLoading, uploadPhoto, isUploadPhotoLoading, uploadPhotoError } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name,
      age: user?.age ?? undefined,
      gender: user?.gender,
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfile(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto(file);
      // Reset input so the same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const initials = user?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Editar Perfil"
      size="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Foto de Perfil */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
            <Avatar.Root className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-rose-500/10 border-2 border-zinc-800 group-hover:border-rose-500/50 transition-colors">
              <Avatar.Image
                src={user?.profilePhotoUrl}
                alt={user?.name}
                className="h-full w-full object-cover"
              />
              <Avatar.Fallback className="text-2xl font-bold text-rose-500">
                {initials}
              </Avatar.Fallback>
            </Avatar.Root>

            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploadPhotoLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handlePhotoClick}
            disabled={isUploadPhotoLoading}
            className="text-xs text-rose-500 hover:text-rose-400 font-medium transition-colors disabled:opacity-50"
          >
            {isUploadPhotoLoading ? 'Enviando...' : 'Alterar foto'}
          </button>
          {uploadPhotoError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Falha ao enviar foto. Tente novamente.</span>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="space-y-4">
          <Input
            label="Nome Completo"
            placeholder="Seu nome"
            {...register('name')}
            error={errors.name?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Idade"
              type="number"
              placeholder="Ex: 25"
              {...register('age', { valueAsNumber: true })}
              error={errors.age?.message}
            />

            <Select
              label="Gênero"
              options={[
                { value: 'MASCULINO', label: 'Masculino' },
                { value: 'FEMININO', label: 'Feminino' },
                { value: 'NAO_BINARIO', label: 'Não binário' },
                { value: 'PREFIRO_NAO_DIZER', label: 'Prefiro não dizer' },
              ]}
              {...register('gender')}
              error={errors.gender?.message}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" isLoading={isUpdateProfileLoading} className="w-full sm:w-auto">
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}
