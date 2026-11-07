import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createCabin as createCabinApi } from '../../services/apiCabins';

export function useCreateCabin() {
  const queryClient = useQueryClient();
  const { mutate: createCabin, isPending: isCreating } = useMutation({
    mutationFn: createCabinApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabins'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Cabin created');
    },
    onError: (error) => toast.error(error.message),
  });
  return { createCabin, isCreating };
}
