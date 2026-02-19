'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useFinancial } from '@/hooks/use-financial';
import { CreateTransactionData, Transaction } from '@/types/financial.types';
import { useEffect } from 'react';
import { TRANSACTION_CATEGORY_LABELS } from '@/utils/constants';

const transactionSchema = z.object({
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
  amount: z.coerce.number().min(1, 'O valor deve ser maior que zero'),
  type: z.enum(['INCOME', 'EXPENSE'], { message: 'Selecione o tipo' }),
  category: z.string().min(1, 'Selecione uma categoria'),
  date: z.string().min(1, 'Selecione a data'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: Transaction;
}

export function TransactionModal({ isOpen, onClose, transaction }: TransactionModalProps) {
  const { createTransaction, updateTransaction, isCreating, isUpdating } = useFinancial();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'EXPENSE',
    }
  });

  useEffect(() => {
    if (transaction) {
      reset({
        description: transaction.description || '',
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date.split('T')[0],
      });
    } else {
      reset({
        description: '',
        amount: 0,
        type: 'EXPENSE',
        category: 'MATERIAL',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [transaction, reset, isOpen]);

  const onSubmit = (data: TransactionFormData) => {
    const formattedData = data as unknown as CreateTransactionData;
    if (transaction) {
      updateTransaction(
        { id: transaction.id, data: formattedData },
        {
          onSuccess: () => {
            onClose();
            reset();
          },
        }
      );
    } else {
      createTransaction(formattedData, {
        onSuccess: () => {
          onClose();
          reset();
        },
      });
    }
  };

  const categoryOptions = Object.entries(TRANSACTION_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const typeOptions = [
    { value: 'INCOME', label: 'Receita (+)' },
    { value: 'EXPENSE', label: 'Despesa (-)' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? 'Editar Transação' : 'Nova Transação'}
    >
      <form onSubmit={handleSubmit((data) => onSubmit(data as TransactionFormData))} className="space-y-4">
        <Input
          label="Descrição"
          placeholder="Ex: Aluguel do estúdio"
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Valor (centavos)"
            type="number"
            placeholder="Ex: 50000"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input
            label="Data"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Tipo"
            options={typeOptions}
            error={errors.type?.message}
            {...register('type')}
          />
          <Select
            label="Categoria"
            options={categoryOptions}
            error={errors.category?.message}
            {...register('category')}
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
            {transaction ? 'Salvar Alterações' : 'Adicionar Transação'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
