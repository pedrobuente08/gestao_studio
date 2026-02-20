'use client';

import { useQuery } from '@tanstack/react-query';
import { sessionsService } from '@/services/sessions.service';

export function useSessionStats(filters: {
  serviceTypeId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['session-stats', filters],
    queryFn: () => sessionsService.getStats(filters),
  });

  return {
    stats,
    isLoading,
    error,
  };
}
