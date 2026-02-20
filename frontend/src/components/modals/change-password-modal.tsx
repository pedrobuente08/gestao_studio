'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/modal';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/use-auth';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const { changePassword, isChangePasswordLoading, changePasswordError } = useAuth();
  const [success, setSuccess] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    changePassword(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => {
            onOpenChange(false);
            setSuccess(false);
            reset();
          }, 2000);
        },
      }
    );
  };

  const getErrorMessage = (error: any) => {
    if (!error) return null;
    return error.response?.data?.message || 'Erro ao alterar senha. Tente novamente.';
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Alterar Senha"
      size="sm"
    >
      {success ? (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Senha alterada!</h3>
            <p className="text-sm text-zinc-400 mt-1">Sua senha foi atualizada com sucesso.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <Input
              label="Senha Atual"
              type="password"
              placeholder="••••••••"
              {...register('currentPassword')}
              error={errors.currentPassword?.message}
            />

            <hr className="border-zinc-800 my-2" />

            <Input
              label="Nova Senha"
              type="password"
              placeholder="••••••••"
              {...register('newPassword')}
              error={errors.newPassword?.message}
            />
            
            <Input
              label="Confirmar Nova Senha"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />
          </div>

          {changePasswordError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{getErrorMessage(changePasswordError)}</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isChangePasswordLoading} className="w-full sm:w-auto">
              Atualizar Senha
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
