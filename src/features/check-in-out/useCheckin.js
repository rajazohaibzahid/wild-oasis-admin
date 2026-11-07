import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { checkinBooking as checkinBookingApi } from '../../services/apiBookings';

export function useCheckin() {
  const queryClient = useQueryClient();
  const { mutate: checkin, isPending: isCheckingIn } = useMutation({
    mutationFn: checkinBookingApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['today-activity'] });
      toast.success('Guest checked in');
    },
    onError: (error) => toast.error(error.message),
  });
  return { checkin, isCheckingIn };
}
