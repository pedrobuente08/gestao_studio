import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantsService } from '@/services/tenants.service';

export function useTenant() {
  const queryClient = useQueryClient();

  const { data: tenant, isLoading: isLoadingTenant } = useQuery({
    queryKey: ['tenant-me'],
    queryFn: tenantsService.getMe,
  });

  const { data: config, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['studio-config'],
    queryFn: tenantsService.getStudioConfig,
  });

  const updateTenantMutation = useMutation({
    mutationFn: tenantsService.updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-me'] });
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: tenantsService.updateStudioConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-config'] });
    },
  });

  return {
    tenant,
    config,
    isLoading: isLoadingTenant || isLoadingConfig,
    updateTenant: updateTenantMutation.mutate,
    updateConfig: updateConfigMutation.mutate,
    isUpdating: updateTenantMutation.isPending || updateConfigMutation.isPending,
  };
}
