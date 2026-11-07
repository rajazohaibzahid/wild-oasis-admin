import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { editCabin as editCabinApi } from '../../services/apiCabins';

export function useEditCabin() {
  const queryClient = useQueryClient();
  const { mutate: editCabin, isPending: isEditing } = useMutation({
    mutationFn: editCabinApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cabins'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Cabin updated');
    },
    onError: (error) => toast.error(error.message),
  });
  return { editCabin, isEditing };
}
