import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getBooking } from '../../services/apiBookings';

export function useBooking() {
  const { bookingId } = useParams();
  const {
    data: booking,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({ queryKey: ['booking', bookingId], queryFn: () => getBooking(bookingId) });
  return { booking, isLoading, error, refetch };
}
