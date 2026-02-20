import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { seedTrainingService } from '@/services/seed-training.service';
import { BulkCreateSeedTrainingData } from '@/types/seed-training.types';

const QUERY_KEY = ['seed-training'];

export function useSeedTraining() {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: seedTrainingService.getAll,
  });

  const { mutate: bulkCreate, isPending: isSaving } = useMutation({
    mutationFn: (data: BulkCreateSeedTrainingData) => seedTrainingService.bulkCreate(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const { mutate: removeEntry, isPending: isRemoving } = useMutation({
    mutationFn: (id: string) => seedTrainingService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return {
    entries,
    isLoading,
    bulkCreate,
    isSaving,
    removeEntry,
    isRemoving,
    savedCount: entries.length,
  };
}
