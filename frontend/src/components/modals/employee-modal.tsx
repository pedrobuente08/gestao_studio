'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useEmployees } from '@/hooks/use-employees';
import { useServiceTypes } from '@/hooks/use-service-types';
import { AxiosError } from 'axios';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  role: z.enum(['EMPLOYEE', 'STAFF']),
  serviceTypeId: z.string().min(1, 'Selecione o tipo de serviço'),
});

type FormData = z.infer<typeof schema>;

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const roleOptions = [
  { value: 'EMPLOYEE', label: 'Prestador' },
  { value: 'STAFF', label: 'Staff (gerente)' },
];

export function EmployeeModal({ isOpen, onClose }: EmployeeModalProps) {
  const { createEmployee, isCreating, createError } = useEmployees();
  const { serviceTypes } = useServiceTypes();

  const serviceTypeOptions = serviceTypes.map(t => ({ value: t.id, label: t.name }));

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'EMPLOYEE', password: 'ink@studio1' },
  });

  const onSubmit = (data: FormData) => {
    createEmployee(data, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const errorMessage = createError instanceof AxiosError
    ? createError.response?.data?.message
    : (createError as any)?.message;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Prestador">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {errorMessage && (
          <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        <Input label="Nome" placeholder="Ex: João Silva" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" placeholder="joao@email.com" error={errors.email?.message} {...register('email')} />
        <Input label="Senha inicial" type="text" error={errors.password?.message} {...register('password')} />
        <Select
          label="Tipo de Serviço"
          placeholder="Selecione o serviço que realiza"
          options={serviceTypeOptions}
          error={errors.serviceTypeId?.message}
          {...register('serviceTypeId')}
        />
        <Select label="Cargo" options={roleOptions} error={errors.role?.message} {...register('role')} />

        <p className="text-xs text-zinc-500">
          O prestador receberá um email de boas-vindas com suas credenciais e um link de ativação. A senha acima é temporária e deverá ser alterada pelo prestador no primeiro acesso.
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isCreating}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isCreating}>
            Cadastrar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
