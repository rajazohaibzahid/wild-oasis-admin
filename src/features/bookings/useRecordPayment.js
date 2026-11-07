import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { recordPayment as recordPaymentApi } from '../../services/apiBookings';

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { mutate: recordPayment, isPending: isRecording } = useMutation({
    mutationFn: recordPaymentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Payment recorded');
    },
    onError: (error) => toast.error(error.message),
  });
  return { recordPayment, isRecording };
}
