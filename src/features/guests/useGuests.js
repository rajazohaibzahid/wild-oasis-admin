import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getGuests } from '../../services/apiGuests';
import { getPage } from '../../utils/helpers';
export function useGuests() {
  const [params] = useSearchParams();
  const search = params.get('search') || '';
  const page = getPage(params.get('page'));
  const contact = params.get('contact') || 'all';
  const {
    data,
    isPending: isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['guests', search, page, contact],
    queryFn: () => getGuests({ search, page, contact }),
  });
  return { guests: data?.guests, count: data?.count || 0, isLoading, error, refetch };
}
