import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getBookings } from '../../services/apiBookings';
import { getPage } from '../../utils/helpers';

export function useBookings(guestId) {
  const [params] = useSearchParams();
  const status = params.get('status') || 'all';
  const sortBy = params.get('sortBy') || 'start_date-desc';
  const page = getPage(params.get('page'));
  const {
    data,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bookings', status, sortBy, page, guestId],
    queryFn: () => getBookings({ status, sortBy, page, guestId }),
  });
  return { bookings: data?.bookings, count: data?.count || 0, isLoading, error, refetch };
}
