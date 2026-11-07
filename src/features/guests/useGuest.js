import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getGuest } from '../../services/apiGuests';
export function useGuest() {
  const { guestId } = useParams();
  const {
    data: guest,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({ queryKey: ['guest', guestId], queryFn: () => getGuest(guestId) });
  return { guest, isLoading, error, refetch };
}
