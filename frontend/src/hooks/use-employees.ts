'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeesService } from '@/services/employees.service';
import { CreateEmployeeData, UpdateEmployeeData } from '@/types/employee.types';

export function useEmployees() {
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: employeesService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEmployeeData) => employeesService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeData }) =>
      employeesService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => employeesService.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  return {
    employees,
    isLoading,
    createEmployee: createMutation.mutate,
    updateEmployee: updateMutation.mutate,
    deactivateEmployee: deactivateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    createError: createMutation.error,
  };
}
